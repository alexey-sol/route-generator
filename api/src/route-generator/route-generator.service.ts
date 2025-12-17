import { DEFAULT_GEOMETRY_TYPE, MIN_ROUTE_COUNT, MODEL_TEMPERATURE } from "./const";
import GET_POINTS_OF_INTEREST_WITHIN_ISOCHRONE_STUB from "./stub/get-points-of-interest-within-isochrone.json";
import {
    Coordinates,
    Isochrone,
    OverpassFeature,
    OverpassResponse,
    RouteGeneratorState,
    StartPoint,
} from "./type";
import { RouteGeneratorStateAnnotation } from "./util";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { CallbackHandler } from "@langfuse/langchain";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { ReactAgent } from "langchain";
import { catchError, firstValueFrom } from "rxjs";
import { ProcessConfigService } from "src/config/config.service";
import { AppConfig } from "src/config/config.type";

const ISOCHRONE_FEATURES_INDEX = 0;
const ISOCHRONE_COORDINATES_INDEX = 0;

@Injectable()
export class RouteGeneratorService {
    private readonly agent: ReactAgent;

    private findRandomEndPoint = (state: RouteGeneratorState) => {
        // TODO implement; pass isochrone and startPoint
        return { endPoint: state.pointsOfInterest.at(-1) };
    };

    private getIsochroneCoordinates = async ({
        startPoint,
        travelTimeInSec,
    }: RouteGeneratorState) => {
        const isochrone = await this.fetchFootWalkingIsochrone(
            startPoint.geometry.coordinates,
            travelTimeInSec,
        );

        return {
            isochroneCoordinates: this.extractIsochroneCoordinates(isochrone),
        };
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private getPointsOfInterestWithinIsochrone = (state: RouteGeneratorState) => {
        // TODO implement; pass isochrone
        return {
            pointsOfInterest:
                GET_POINTS_OF_INTEREST_WITHIN_ISOCHRONE_STUB.features as unknown as OverpassResponse["features"],
        };
    };

    private getRoutes = (state: RouteGeneratorState) => {
        // TODO implement; pass endPoint, pointsOfInterest, routeCount, startPoint
        return {
            routes: Array.from({ length: state.routeCount }).map(() => [
                state.startPoint,
                state.pointsOfInterest[0],
                state.endPoint,
            ]) as Array<[StartPoint, ...OverpassFeature[]]>,
        };
    };

    private getRouteWaypoints = (state: RouteGeneratorState) => {
        // TODO implement; pass routes
        return {
            routeWaypoints: state.routes.map((route) => ({
                route,
                waypoints: [],
            })),
        };
    };

    private readonly chain = new StateGraph(RouteGeneratorStateAnnotation)
        .addNode("getIsochroneCoordinates", this.getIsochroneCoordinates)
        .addNode("getPointsOfInterestWithinIsochrone", this.getPointsOfInterestWithinIsochrone)
        .addNode("findRandomEndPoint", this.findRandomEndPoint)
        .addNode("getRoutes", this.getRoutes)
        .addNode("getRouteWaypoints", this.getRouteWaypoints)
        .addEdge(START, "getIsochroneCoordinates")
        .addEdge("getIsochroneCoordinates", "getPointsOfInterestWithinIsochrone")
        .addEdge("getPointsOfInterestWithinIsochrone", "findRandomEndPoint")
        .addEdge("findRandomEndPoint", "getRoutes")
        .addEdge("getRoutes", "getRouteWaypoints")
        .addEdge("getRouteWaypoints", END)
        .compile();

    private readonly langfuseHandler: BaseCallbackHandler;

    private readonly logger = new Logger(RouteGeneratorService.name);

    private readonly model: ChatOpenAI;

    constructor(
        private readonly configService: ConfigService<AppConfig, true>,
        private readonly processConfigService: ProcessConfigService,
        private readonly httpService: HttpService,
    ) {
        const { apiKey, baseUrl, model } = configService.get("openAi", { infer: true });

        this.model = new ChatOpenAI({
            configuration: {
                apiKey,
                baseURL: baseUrl,
            },
            model,
            temperature: MODEL_TEMPERATURE,
        });

        this.langfuseHandler = new CallbackHandler({
            tags: ["chat-test"],
        }) as BaseCallbackHandler;
    }

    async generateRoutes(
        startCoordinates: Coordinates,
        travelTimeInSec: number,
        routeCount = MIN_ROUTE_COUNT,
    ) {
        const startPoint: StartPoint = {
            geometry: {
                coordinates: startCoordinates,
                type: DEFAULT_GEOMETRY_TYPE,
            },
        };

        const state = await this.chain.invoke({ routeCount, startPoint, travelTimeInSec });

        return state.routeWaypoints;
    }

    private extractIsochroneCoordinates = (isochrone: Isochrone) =>
        isochrone?.features?.[ISOCHRONE_FEATURES_INDEX]?.geometry?.coordinates?.[
            ISOCHRONE_COORDINATES_INDEX
        ] ?? [];

    private async fetchFootWalkingIsochrone(
        coordinates: Coordinates,
        travelTimeInSec: number,
    ): Promise<Isochrone> {
        const { data } = await firstValueFrom(
            this.httpService
                .post<Isochrone>("/v2/isochrones/foot-walking", {
                    locations: [coordinates],
                    range: [travelTimeInSec, travelTimeInSec],
                })
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(error.response?.data);
                        throw error;
                    }),
                ),
        );

        return data;
    }
}

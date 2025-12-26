import { DEFAULT_POINT_TYPE, MIN_ROUTE_COUNT, MODEL_TEMPERATURE } from "./const";
import { IsochroneService } from "./service/isochrone.service";
import { PointsOfInterestService } from "./service/points-of-interest.service";
import { Coordinates, Point, RouteGeneratorState } from "./type";
import { RouteGeneratorStateAnnotation } from "./util";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { CallbackHandler } from "@langfuse/langchain";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { ReactAgent } from "langchain";
import { AppConfig } from "src/config/config.type";

@Injectable()
export class RouteGeneratorService {
    private readonly agent: ReactAgent;

    private findRandomEndPoint = (state: RouteGeneratorState) => {
        // TODO implement; pass isochrone and startPoint
        return { endPoint: state.pointsOfInterest.at(-1) };
    };

    private getIsochrone = async (state: RouteGeneratorState) => ({
        isochrone: await this.isochroneService.getIsochrone(state),
    });

    private getPointsOfInterest = async (state: RouteGeneratorState) => ({
        pointsOfInterest: await this.pointsOfInterestService.getPointsOfInterest(state),
    });

    private getRoutes = (state: RouteGeneratorState) => {
        // TODO implement; pass endPoint, pointsOfInterest, routeCount, startPoint
        return {
            routes: Array.from({ length: state.routeCount }).map(() => [
                state.startPoint,
                state.pointsOfInterest[0],
                state.endPoint,
            ]),
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
        .addNode("getIsochrone", this.getIsochrone)
        .addNode("getPointsOfInterest", this.getPointsOfInterest, {
            retryPolicy: {
                initialInterval: 2,
                maxAttempts: 5,
                retryOn: (error: AxiosError) => {
                    return (
                        error instanceof AxiosError &&
                        Boolean(error.status) &&
                        error.status >= HttpStatus.INTERNAL_SERVER_ERROR
                    );
                },
            },
        })
        .addNode("findRandomEndPoint", this.findRandomEndPoint)
        .addNode("getRoutes", this.getRoutes)
        .addNode("getRouteWaypoints", this.getRouteWaypoints)
        .addEdge(START, "getIsochrone")
        .addEdge("getIsochrone", "getPointsOfInterest")
        .addEdge("getPointsOfInterest", "findRandomEndPoint")
        .addEdge("findRandomEndPoint", "getRoutes")
        .addEdge("getRoutes", "getRouteWaypoints")
        // TODO обогатить route points описанием от ЛЛМ
        .addEdge("getRouteWaypoints", END)
        .compile();

    private readonly langfuseHandler: BaseCallbackHandler;

    private readonly logger = new Logger(RouteGeneratorService.name);

    private readonly model: ChatOpenAI;

    constructor(
        private readonly isochroneService: IsochroneService,
        private readonly pointsOfInterestService: PointsOfInterestService,
        configService: ConfigService<AppConfig, true>,
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
        const startPoint: Point = {
            coordinates: startCoordinates,
            type: DEFAULT_POINT_TYPE,
        };

        const state = await this.chain.invoke({ routeCount, startPoint, travelTimeInSec });

        return state.routeWaypoints;
    }
}

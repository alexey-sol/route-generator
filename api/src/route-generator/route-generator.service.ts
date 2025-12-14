import { DEFAULT_GEOMETRY_TYPE, MIN_ROUTE_COUNT, MODEL_TEMPERATURE } from "./const";
import GET_ISOCHRONE_STUB from "./stub/get-isochrone.json";
import GET_POINTS_OF_INTEREST_WITHIN_ISOCHRONE_STUB from "./stub/get-points-of-interest-within-isochrone.json";
import {
    Coordinates,
    Isochrone,
    NumberRange,
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
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ReactAgent } from "langchain";
import { ProcessConfigService } from "src/config/config.service";
import { AppConfig } from "src/config/config.type";

@Injectable()
export class RouteGenerator {
    private readonly agent: ReactAgent;

    private findRandomEndPoint = (state: RouteGeneratorState) => {
        // TODO implement; pass isochrone and startPoint
        return { endPoint: state.pointsOfInterest.at(-1) };
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private getIsochrone = (state: RouteGeneratorState) => {
        // TODO implement; pass startPoint and travelTimeRangeInSec
        return { isochrone: GET_ISOCHRONE_STUB as unknown as Isochrone };
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private getPointsOfInterestWithinIsochrone = (state: RouteGeneratorState) => {
        // TODO implement; pass isochrone
        return {
            pointsOfInterest:
                GET_POINTS_OF_INTEREST_WITHIN_ISOCHRONE_STUB.features as OverpassResponse["features"],
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
        .addNode("getIsochrone", this.getIsochrone)
        .addNode("getPointsOfInterestWithinIsochrone", this.getPointsOfInterestWithinIsochrone)
        .addNode("findRandomEndPoint", this.findRandomEndPoint)
        .addNode("getRoutes", this.getRoutes)
        .addNode("getRouteWaypoints", this.getRouteWaypoints)
        .addEdge(START, "getIsochrone")
        .addEdge("getIsochrone", "getPointsOfInterestWithinIsochrone")
        .addEdge("getPointsOfInterestWithinIsochrone", "findRandomEndPoint")
        .addEdge("findRandomEndPoint", "getRoutes")
        .addEdge("getRoutes", "getRouteWaypoints")
        .addEdge("getRouteWaypoints", END)
        .compile();

    private readonly langfuseHandler: BaseCallbackHandler;

    private readonly model: ChatOpenAI;

    constructor(
        private readonly configService: ConfigService<AppConfig, true>,
        readonly processConfigService: ProcessConfigService,
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
        travelTimeRangeInSec: NumberRange,
        routeCount = MIN_ROUTE_COUNT,
    ) {
        const startPoint: StartPoint = {
            geometry: {
                coordinates: startCoordinates,
                type: DEFAULT_GEOMETRY_TYPE,
            },
        };

        const state = await this.chain.invoke({ routeCount, startPoint, travelTimeRangeInSec });

        return state.routeWaypoints;
    }
}

import { MIN_ROUTE_COUNT, MODEL_TEMPERATURE } from "./const";
import { IsochroneService } from "./service/isochrone.service";
import { PointsOfInterestService } from "./service/points-of-interest.service";
import { RouteBoundingBoxService } from "./service/route-bounding-box.service";
import { RouteGeneratorService } from "./service/route-generator.service";
import { Coordinates, WalkingRouteState } from "./type";
import { NodePoint, NoRouteEndPointFoundError, WalkingRouteStateAnnotation } from "./util";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { CallbackHandler } from "@langfuse/langchain";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { ReactAgent } from "langchain";
import { AppConfig } from "src/config/config.type";

const INITIAL_RETRY_INTERVAL_MS = 1_000;

@Injectable()
export class WalkingRouteService {
    private readonly agent: ReactAgent;

    private filterPointsOfInterest = (state: WalkingRouteState) => {
        const endPoint = this.routeBoundingBoxService.findRouteEndPoint(state);

        if (!endPoint) {
            throw new NoRouteEndPointFoundError();
        }

        const filteredPoints = this.routeBoundingBoxService.filterPointsOutsideBoundingBox({
            endPoint,
            pointsOfInterest: state.pointsOfInterest,
            startPoint: state.startPoint,
        });

        return {
            endPoint,
            pointsOfInterest: filteredPoints,
        };
    };

    private getIsochrone = async (state: WalkingRouteState) => ({
        isochrone: await this.isochroneService.getIsochrone(state),
    });

    private getPointsOfInterest = async (state: WalkingRouteState) => ({
        pointsOfInterest: await this.pointsOfInterestService.getPointsOfInterest(state),
    });

    private getRoutes = (state: WalkingRouteState) => {
        return {
            routes: this.routeGeneratorService.generateRoutes(state),
        };
    };

    private getRouteWaypoints = (state: WalkingRouteState) => {
        // TODO implement; pass routes
        return {
            routeWaypoints: state.routes.map((route) => ({
                route,
                waypoints: [],
            })),
        };
    };

    private readonly chain = new StateGraph(WalkingRouteStateAnnotation)
        .addNode("getIsochrone", this.getIsochrone)
        .addNode("getPointsOfInterest", this.getPointsOfInterest, {
            retryPolicy: {
                initialInterval: INITIAL_RETRY_INTERVAL_MS,
                maxAttempts: 5,
                retryOn: (error: AxiosError) => {
                    return (
                        error instanceof AxiosError &&
                        !!error.status &&
                        error.status >= HttpStatus.INTERNAL_SERVER_ERROR
                    );
                },
            },
        })
        .addNode("filterPointsOfInterest", this.filterPointsOfInterest)
        .addNode("getRoutes", this.getRoutes)
        .addNode("getRouteWaypoints", this.getRouteWaypoints)
        .addEdge(START, "getIsochrone")
        .addEdge("getIsochrone", "getPointsOfInterest")
        .addEdge("getPointsOfInterest", "filterPointsOfInterest")
        .addEdge("filterPointsOfInterest", "getRoutes")
        .addEdge("getRoutes", "getRouteWaypoints")
        // TODO обогатить route points описанием от ЛЛМ
        .addEdge("getRouteWaypoints", END)
        .compile();

    private readonly langfuseHandler: BaseCallbackHandler;

    private readonly logger = new Logger(WalkingRouteService.name);

    private readonly model: ChatOpenAI;

    constructor(
        private readonly isochroneService: IsochroneService,
        private readonly pointsOfInterestService: PointsOfInterestService,
        private readonly routeBoundingBoxService: RouteBoundingBoxService,
        private readonly routeGeneratorService: RouteGeneratorService,
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
        const startPoint = new NodePoint(startCoordinates);

        const state = await this.chain.invoke({ routeCount, startPoint, travelTimeInSec });

        return state.routeWaypoints;
    }
}

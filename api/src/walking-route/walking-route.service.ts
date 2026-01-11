import { MIN_ROUTE_COUNT } from "./const";
import { IsochroneService } from "./service/isochrone.service";
import { PlacesOfInterestService } from "./service/places-of-interest.service";
import { RouteBoundingBoxService } from "./service/route-bounding-box.service";
import { RouteGeneratorService } from "./service/route-generator.service";
import { RoutePointPropertiesService } from "./service/route-point-properties.service";
import { RouteWaypointService } from "./service/route-waypoint.service";
import { PointPlace, type Route, type WalkingRouteState } from "./type";
import {
    DeleteRoutePointRequest,
    getPointPlace,
    GetRouteRequest,
    NoRouteEndPointFoundError,
    WalkingRouteStateAnnotation,
} from "./util";
import { DEFAULT_LANGUAGE } from "@/const";
import { END, type RetryPolicy, START, StateGraph } from "@langchain/langgraph";
import { HttpStatus, Injectable } from "@nestjs/common";
import { AxiosError } from "axios";

const INITIAL_RETRY_INTERVAL_MS = 1_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class WalkingRouteService {
    private addRoutePointTeasers = async (state: WalkingRouteState) => ({
        routes: await this.routePointPropertiesService.addPointTeasers(state),
    });

    private addRouteWaypoints = async (state: WalkingRouteState) => ({
        routes: await this.routeWaypointService.addRouteWaypoints(state),
    });

    private getIsochrone = async (state: WalkingRouteState) => ({
        isochrone: await this.isochroneService.getIsochrone(state),
    });

    private getPlacesOfInterest = async ({ isochrone, startPoint }: WalkingRouteState) => {
        const placesOfInterest = await this.placesOfInterestService.getPlacesOfInterest({
            isochrone,
        });

        const endPoint = this.routeBoundingBoxService.findEndPoint({
            placesOfInterest,
            startPoint,
        });

        if (!endPoint) {
            throw new NoRouteEndPointFoundError();
        }

        const routablePlaces = this.routeBoundingBoxService.filterPlacesOutsideBoundingBox({
            endPoint,
            placesOfInterest,
            startPoint,
        });

        return {
            endPoint,
            placesOfInterest: routablePlaces,
        };
    };

    private getRetryPolicy = (): RetryPolicy => {
        return {
            initialInterval: INITIAL_RETRY_INTERVAL_MS,
            maxAttempts: MAX_ATTEMPTS,
            retryOn: (error: AxiosError) =>
                error instanceof AxiosError &&
                !!error.status &&
                error.status >= HttpStatus.INTERNAL_SERVER_ERROR,
        };
    };

    private getRoutes = (state: WalkingRouteState) => ({
        routes: this.routeGeneratorService.generateRoutes(state),
    });

    private readonly chain = new StateGraph(WalkingRouteStateAnnotation)
        .addNode("getIsochrone", this.getIsochrone, {
            retryPolicy: this.getRetryPolicy(),
        })
        .addNode("getPlacesOfInterest", this.getPlacesOfInterest, {
            retryPolicy: this.getRetryPolicy(),
        })
        .addNode("getRoutes", this.getRoutes)
        .addNode("addRoutePointTeasers", this.addRoutePointTeasers, {
            retryPolicy: this.getRetryPolicy(),
        })
        .addNode("addRouteWaypoints", this.addRouteWaypoints, {
            retryPolicy: this.getRetryPolicy(),
        })
        .addEdge(START, "getIsochrone")
        .addEdge("getIsochrone", "getPlacesOfInterest")
        .addEdge("getPlacesOfInterest", "getRoutes")
        .addEdge("getRoutes", "addRoutePointTeasers")
        .addEdge("addRoutePointTeasers", "addRouteWaypoints")
        .addEdge("addRouteWaypoints", END)
        .compile();

    constructor(
        private readonly isochroneService: IsochroneService,
        private readonly placesOfInterestService: PlacesOfInterestService,
        private readonly routeBoundingBoxService: RouteBoundingBoxService,
        private readonly routeGeneratorService: RouteGeneratorService,
        private readonly routePointPropertiesService: RoutePointPropertiesService,
        private readonly routeWaypointService: RouteWaypointService,
    ) {}

    async deleteRoutePoint({
        currentCoordinates,
        language = DEFAULT_LANGUAGE,
        pointIdToDelete,
        routePoints,
    }: DeleteRoutePointRequest): Promise<Route> {
        const points: PointPlace[] = [
            getPointPlace(currentCoordinates),
            ...this.getPointsAfterTarget(routePoints, pointIdToDelete),
        ];

        const waypoints = await this.routeWaypointService.getRouteWaypoints(points, language);

        return { points, waypoints };
    }

    async generateRoutes({
        language = DEFAULT_LANGUAGE,
        routeCount = MIN_ROUTE_COUNT,
        startCoordinates,
        travelTimeInSec,
    }: GetRouteRequest): Promise<Route[]> {
        const state = await this.chain.invoke({
            language,
            routeCount,
            startPoint: getPointPlace(startCoordinates),
            travelTimeInSec,
        });

        return state.routes;
    }

    private getPointsAfterTarget = (
        points: PointPlace[],
        targetId: NonNullable<PointPlace["id"]>,
    ): PointPlace[] => {
        const index = points.findIndex((item) => item.id === targetId);

        if (index === -1) {
            return points;
        }

        return points.slice(index + 1);
    };
}

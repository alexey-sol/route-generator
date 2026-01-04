import { MIN_ROUTE_COUNT } from "./const";
import { IsochroneService } from "./service/isochrone.service";
import { PlacePropertiesService } from "./service/place-properties.service";
import { PlacesOfInterestService } from "./service/places-of-interest.service";
import { RouteBoundingBoxService } from "./service/route-bounding-box.service";
import { RouteGeneratorService } from "./service/route-generator.service";
import { Coordinates, WalkingRouteState } from "./type";
import { getPointPlace, NoRouteEndPlaceFoundError, WalkingRouteStateAnnotation } from "./util";
import { DEFAULT_LANGUAGE } from "@/const";
import { END, type RetryPolicy, START, StateGraph } from "@langchain/langgraph";
import { HttpStatus, Injectable } from "@nestjs/common";
import { AxiosError } from "axios";

const INITIAL_RETRY_INTERVAL_MS = 1_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class WalkingRouteService {
    private addPlaceTeasers = async (state: WalkingRouteState) => ({
        routes: await this.placePropertiesService.addPlaceTeasers(state),
    });

    private getIsochrone = async (state: WalkingRouteState) => ({
        isochrone: await this.isochroneService.getIsochrone(state),
    });

    private getPlacesOfInterest = async ({ isochrone, startPlace }: WalkingRouteState) => {
        const placesOfInterest = await this.placesOfInterestService.getPlacesOfInterest({
            isochrone,
        });

        const endPlace = this.routeBoundingBoxService.findEndPlace({
            placesOfInterest,
            startPlace,
        });

        if (!endPlace) {
            throw new NoRouteEndPlaceFoundError();
        }

        const routablePlaces = this.routeBoundingBoxService.filterPlacesOutsideBoundingBox({
            endPlace,
            placesOfInterest,
            startPlace,
        });

        return {
            endPlace,
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
        .addNode("getIsochrone", this.getIsochrone, {
            retryPolicy: this.getRetryPolicy(),
        })
        .addNode("getPlacesOfInterest", this.getPlacesOfInterest, {
            retryPolicy: this.getRetryPolicy(),
        })
        .addNode("getRoutes", this.getRoutes)
        .addNode("addPlaceTeasers", this.addPlaceTeasers, {
            retryPolicy: this.getRetryPolicy(),
        })
        .addNode("getRouteWaypoints", this.getRouteWaypoints)
        .addEdge(START, "getIsochrone")
        .addEdge("getIsochrone", "getPlacesOfInterest")
        .addEdge("getPlacesOfInterest", "getRoutes")
        .addEdge("getRoutes", "addPlaceTeasers")
        .addEdge("addPlaceTeasers", "getRouteWaypoints")
        .addEdge("getRouteWaypoints", END)
        .compile();

    constructor(
        private readonly isochroneService: IsochroneService,
        private readonly placesOfInterestService: PlacesOfInterestService,
        private readonly routeBoundingBoxService: RouteBoundingBoxService,
        private readonly routeGeneratorService: RouteGeneratorService,
        private readonly placePropertiesService: PlacePropertiesService,
    ) {}

    async generateRoutes(
        startCoordinates: Coordinates,
        travelTimeInSec: number,
        routeCount = MIN_ROUTE_COUNT,
    ) {
        const startPlace = getPointPlace(startCoordinates);

        const state = await this.chain.invoke({
            language: DEFAULT_LANGUAGE,
            routeCount,
            startPlace,
            travelTimeInSec,
        });

        return state.routeWaypoints;
    }
}

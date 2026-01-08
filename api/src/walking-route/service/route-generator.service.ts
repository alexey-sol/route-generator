import { type AnyPlace, type WalkingRouteState } from "../type";
import { findNearestPoint, NotUniqueRouteError } from "../util";
import { pickEvenlyWithJitter } from "@/util/helpers";
import { Injectable } from "@nestjs/common";

type BaseRoute = AnyPlace[];

const FIRST_PLACE_INDEX = 0;
const PICK_POINT_JITTER = 2;
const MAX_ATTEMPTS_TO_GENERATE_ROUTE = 50;

@Injectable()
export class RouteGeneratorService {
    /**
     * Returns an array of unique routes with the length of routeCount.
     */
    generateRoutes = (
        state: Pick<
            WalkingRouteState,
            "endPoint" | "placesOfInterest" | "routeCount" | "startPoint" | "travelTimeInSec"
        >,
    ): WalkingRouteState["routes"] => {
        const baseRoutes: BaseRoute[] = [];

        for (let count = 0; count < state.routeCount; count++) {
            baseRoutes.push(this.generateUniqueRoute(baseRoutes, state));
        }

        return this.mapRoutes(baseRoutes, state);
    };

    /**
     * Generates a unique route. Doesn't include startPoint and endPoint: those will be added later.
     */
    private generateUniqueRoute = (
        baseRoutes: BaseRoute[],
        {
            endPoint,
            placesOfInterest,
            travelTimeInSec,
        }: Pick<WalkingRouteState, "endPoint" | "placesOfInterest" | "travelTimeInSec">,
    ): BaseRoute => {
        const placesToPick = this.getPlacesToPick(travelTimeInSec);

        let attempts = 0;

        while (attempts < MAX_ATTEMPTS_TO_GENERATE_ROUTE) {
            const route = pickEvenlyWithJitter(placesOfInterest, placesToPick, PICK_POINT_JITTER);

            if (!this.hasDuplicates(route, endPoint) && this.isUniqueRoute(route, baseRoutes)) {
                return route;
            }

            attempts++;
        }

        throw new NotUniqueRouteError();
    };

    private getPlacesToPick = (travelTimeInSec: WalkingRouteState["travelTimeInSec"]) =>
        Math.ceil(travelTimeInSec / (travelTimeInSec / 5));

    private hasDuplicates = (route: BaseRoute, endPoint: WalkingRouteState["endPoint"]) => {
        const hasDuplicatePlaces = new Set(route.map(({ id }) => id)).size !== route.length;
        const hasDuplicateEndPoint = route.some((point) => point.id === endPoint.id);

        return hasDuplicatePlaces || hasDuplicateEndPoint;
    };

    /**
     * Checks only the first place of the route, it's enough.
     */
    private isUniqueRoute = (route: BaseRoute, existingRoutes: BaseRoute[]) => {
        if (existingRoutes.length === 0) {
            return true;
        }

        return !existingRoutes.some(
            (existingRoute) => existingRoute[FIRST_PLACE_INDEX].id === route[FIRST_PLACE_INDEX].id,
        );
    };

    /**
     * Completes each route by adding startPoint and endPoint. Waypoints will be added outside.
     */
    private mapRoutes = (
        baseRoutes: BaseRoute[],
        { endPoint, startPoint }: Pick<WalkingRouteState, "endPoint" | "startPoint">,
    ): WalkingRouteState["routes"] => {
        return baseRoutes.map((baseRoute) => {
            const basePoints = baseRoute.map((place) => findNearestPoint(place, startPoint));

            return {
                points: [startPoint, ...basePoints, endPoint],
                waypoints: [],
            };
        });
    };
}

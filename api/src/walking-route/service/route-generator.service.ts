import { AnyPlace, Route, WalkingRouteState } from "../type";
import { NotUniqueRouteError } from "../util";
import { pickEvenlyWithJitter } from "@/util/helpers";
import { Injectable } from "@nestjs/common";

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
            "endPlace" | "placesOfInterest" | "routeCount" | "startPlace" | "travelTimeInSec"
        >,
    ): Route[] => {
        const rawRoutes: Route[] = [];

        for (let count = 0; count < state.routeCount; count++) {
            const rawRoute = this.generateUniqueRoute(rawRoutes, state);
            rawRoutes.push(rawRoute);
        }

        return this.mapRoutes(rawRoutes, state);
    };

    /**
     * Generates a unique route. Doesn't include startPlace and endPlace: those will be added later.
     */
    private generateUniqueRoute = (
        rawRoutes: Route[],
        {
            endPlace,
            placesOfInterest,
            travelTimeInSec,
        }: Pick<WalkingRouteState, "endPlace" | "placesOfInterest" | "travelTimeInSec">,
    ): AnyPlace[] => {
        const placesToPick = this.getPlacesToPick(travelTimeInSec);

        let attempts = 0;

        while (attempts < MAX_ATTEMPTS_TO_GENERATE_ROUTE) {
            const route = pickEvenlyWithJitter(placesOfInterest, placesToPick, PICK_POINT_JITTER);

            if (!this.hasDuplicates(route, endPlace) && this.isUniqueRoute(route, rawRoutes)) {
                return route;
            }

            attempts++;
        }

        throw new NotUniqueRouteError();
    };

    private getPlacesToPick = (travelTimeInSec: WalkingRouteState["travelTimeInSec"]) =>
        Math.ceil(travelTimeInSec / (travelTimeInSec / 5));

    private hasDuplicates = (route: Route, endPlace: WalkingRouteState["endPlace"]) => {
        const hasDuplicatePlaces = new Set(route.map(({ id }) => id)).size !== route.length;
        const hasDuplicateEndPlace = route.at(-1)?.id === endPlace.id;

        return hasDuplicatePlaces || hasDuplicateEndPlace;
    };

    /**
     * Checks only the first place of the route, it's enough.
     */
    private isUniqueRoute = (rawRoute: Route, existingRawRoutes: Route[]) => {
        if (existingRawRoutes.length === 0) {
            return true;
        }

        return existingRawRoutes.some(
            (existingRoute) =>
                existingRoute[FIRST_PLACE_INDEX].id !== rawRoute[FIRST_PLACE_INDEX].id,
        );
    };

    /**
     * Completes each route by adding startPlace and endPlace.
     */
    private mapRoutes = (
        rawRoutes: Route[],
        { endPlace, startPlace }: Pick<WalkingRouteState, "endPlace" | "startPlace">,
    ) => {
        return rawRoutes.map((route) => [startPlace, ...route, endPlace]);
    };
}

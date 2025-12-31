import { Point, Route, WalkingRouteState } from "../type";
import { NotUniqueRouteError } from "../util";
import { pickEvenlyWithJitter } from "@/util/helpers";
import { Injectable } from "@nestjs/common";

const FIRST_POINT_INDEX = 0;
const PICK_POINT_JITTER = 2;
const MAX_ATTEMPTS_TO_GENERATE_ROUTE = 50;

@Injectable()
export class RouteGeneratorService {
    /**
     * Returns an array of unique routes with the length = routeCount.
     */
    generateRoutes = (
        state: Pick<
            WalkingRouteState,
            "endPoint" | "pointsOfInterest" | "routeCount" | "startPoint" | "travelTimeInSec"
        >,
    ): Route[] => {
        const routes: Route[] = [];

        for (let count = 0; count < state.routeCount; count++) {
            const route = this.generateUniqueRoute({
                ...state,
                routes,
            });
            routes.push(route);
        }

        return this.mapRoutes({ ...state, routes });
    };

    /**
     * Generates a unique route. Doesn't include startPoint and endPoints: those should be added later.
     */
    private generateUniqueRoute = ({
        endPoint,
        pointsOfInterest,
        routes,
        travelTimeInSec,
    }: Pick<
        WalkingRouteState,
        "endPoint" | "pointsOfInterest" | "routes" | "travelTimeInSec"
    >): Point[] => {
        const pointsToPick = this.getPointsToPick(travelTimeInSec);

        let attempts = 0;

        while (attempts < MAX_ATTEMPTS_TO_GENERATE_ROUTE) {
            const route = pickEvenlyWithJitter(pointsOfInterest, pointsToPick, PICK_POINT_JITTER);

            if (!this.hasDuplicates(route, endPoint) && this.isUniqueRoute(route, routes)) {
                return route;
            }

            attempts++;
        }

        throw new NotUniqueRouteError();
    };

    private getPointsToPick = (travelTimeInSec: WalkingRouteState["travelTimeInSec"]) =>
        Math.ceil(travelTimeInSec / (travelTimeInSec / 5));

    private hasDuplicates = (route: Route, endPoint: WalkingRouteState["endPoint"]) => {
        const hasDuplicatePoints = new Set(route.map(({ id }) => id)).size !== route.length;
        const hasDuplicateEndPoint = route.at(-1)?.id === endPoint.id;

        return hasDuplicatePoints || hasDuplicateEndPoint;
    };

    /**
     * Checks only the first point of the route, which is enough.
     */
    private isUniqueRoute = (route: Route, routes: WalkingRouteState["routes"]) => {
        if (routes.length === 0) {
            return true;
        }

        return routes.some(
            (existingRoute) => existingRoute[FIRST_POINT_INDEX].id !== route[FIRST_POINT_INDEX].id,
        );
    };

    /**
     * Completes each route by adding startPoint and endPoint.
     */
    private mapRoutes = ({
        endPoint,
        routes,
        startPoint,
    }: Pick<WalkingRouteState, "endPoint" | "routes" | "startPoint">) =>
        routes.map((route) => [startPoint, ...route, endPoint]);
}

import { PointType } from "./const";
import { type BoundingBox, type Coordinates, type Isochrone, type Point, type Route } from "./type";
import { Annotation } from "@langchain/langgraph";

export const RouteGeneratorStateAnnotation = Annotation.Root({
    endPoint: Annotation<Point>,
    isochrone: Annotation<Isochrone>,
    pointsOfInterest: Annotation<Point[]>,
    routeBoundingBox: Annotation<BoundingBox>,
    routeCount: Annotation<number>,
    routes: Annotation<Route[]>,
    routeWaypoints: Annotation<
        Array<{
            route: Route;
            waypoints: Coordinates[];
        }>
    >,
    startPoint: Annotation<Point>,
    travelTimeInSec: Annotation<number>,
});

export class NodePoint implements Point {
    readonly type = PointType.Node;

    constructor(
        readonly coordinates: Point["coordinates"],
        readonly info?: Point["info"],
    ) {}
}

/**
 * The error indicates that the user is in the middle of nowhere or their walk is too short.
 */
export class NoRouteEndPointFoundError extends Error {
    constructor(message = "No route end point found") {
        super(message);
    }
}

export class RelationPoint implements Point {
    readonly type = PointType.Relation;

    constructor(
        readonly coordinates: Point["coordinates"],
        readonly info?: Point["info"],
    ) {}
}

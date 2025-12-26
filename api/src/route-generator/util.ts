import { type Coordinates, type Isochrone, type Point, type Route } from "./type";
import { Annotation } from "@langchain/langgraph";

export const RouteGeneratorStateAnnotation = Annotation.Root({
    endPoint: Annotation<Point>,
    isochrone: Annotation<Isochrone>,
    pointsOfInterest: Annotation<Point[]>,
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

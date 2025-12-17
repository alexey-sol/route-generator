import {
    type Coordinates,
    type Isochrone,
    type OverpassFeature,
    type OverpassResponse,
    type Route,
    type StartPoint,
} from "./type";
import { Annotation } from "@langchain/langgraph";

export const RouteGeneratorStateAnnotation = Annotation.Root({
    endPoint: Annotation<OverpassFeature>,
    isochroneCoordinates: Annotation<Isochrone>,
    pointsOfInterest: Annotation<OverpassResponse["features"]>,
    routeCount: Annotation<number>,
    routes: Annotation<Route[]>,
    routeWaypoints: Annotation<
        Array<{
            route: Route;
            waypoints: Coordinates[];
        }>
    >,
    startPoint: Annotation<StartPoint>,
    travelTimeInSec: Annotation<number>,
});

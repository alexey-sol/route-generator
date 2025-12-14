import {
    type Coordinates,
    type Isochrone,
    type NumberRange,
    type OverpassFeature,
    type OverpassResponse,
    type Route,
    type StartPoint,
} from "./type";
import { Annotation } from "@langchain/langgraph";

export const RouteGeneratorStateAnnotation = Annotation.Root({
    endPoint: Annotation<OverpassFeature>,
    isochrone: Annotation<Isochrone>,
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
    travelTimeRangeInSec: Annotation<NumberRange>,
});

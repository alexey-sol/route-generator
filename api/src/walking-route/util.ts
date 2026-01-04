import {
    type AnyPlace,
    type Coordinates,
    type Isochrone,
    type MultiPolygonPlace,
    type PointPlace,
    type PolygonPlace,
    type Route,
} from "./type";
import { Annotation } from "@langchain/langgraph";

export const WalkingRouteStateAnnotation = Annotation.Root({
    endPlace: Annotation<AnyPlace>,
    isochrone: Annotation<Isochrone>,
    language: Annotation<string>,
    placesOfInterest: Annotation<AnyPlace[]>,
    routeCount: Annotation<number>,
    routes: Annotation<Route[]>,
    routeWaypoints: Annotation<
        Array<{
            route: Route;
            waypoints: Coordinates[];
        }>
    >,
    startPlace: Annotation<PointPlace>,
    travelTimeInSec: Annotation<number>,
});

export const getPointPlace = (
    coordinates: PointPlace["geometry"]["coordinates"],
    properties: PointPlace["properties"] = null,
): PointPlace => ({
    geometry: {
        coordinates,
        type: "Point",
    },
    properties,
    type: "Feature",
});

export const getPolygonPlace = (
    coordinates: PolygonPlace["geometry"]["coordinates"],
    properties: PolygonPlace["properties"] = null,
): PolygonPlace => ({
    geometry: {
        coordinates,
        type: "Polygon",
    },
    properties,
    type: "Feature",
});

export const getMultiPolygonPlace = (
    coordinates: MultiPolygonPlace["geometry"]["coordinates"],
    properties: MultiPolygonPlace["properties"] = null,
): MultiPolygonPlace => ({
    geometry: {
        coordinates,
        type: "MultiPolygon",
    },
    properties,
    type: "Feature",
});

export class NoBoundingBoxProvidedError extends Error {
    constructor(message = "No bounding box provided") {
        super(message);
    }
}

/**
 * The error indicates that the user is in the middle of nowhere or their walk is too short.
 */
export class NoRouteEndPlaceFoundError extends Error {
    constructor(message = "No route end point found") {
        super(message);
    }
}

// TODO think about how to handle this case properly
export class NotUniqueRouteError extends Error {
    constructor(message = "Failed to generate unique route") {
        super(message);
    }
}

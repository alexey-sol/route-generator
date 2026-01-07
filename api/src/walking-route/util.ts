import {
    type AnyPlace,
    type Isochrone,
    type MultiPolygonPlace,
    type PointPlace,
    type PolygonPlace,
    type Route,
} from "./type";
import { isPointFeature } from "@/util/guards";
import { Annotation } from "@langchain/langgraph";
import { explode, nearestPoint } from "@turf/turf";

export const WalkingRouteStateAnnotation = Annotation.Root({
    endPoint: Annotation<PointPlace>,
    isochrone: Annotation<Isochrone>,
    language: Annotation<string>,
    placesOfInterest: Annotation<AnyPlace[]>,
    routeCount: Annotation<number>,
    // routes: Annotation<Route[]>,
    routes: Annotation<Route[]>,
    startPoint: Annotation<PointPlace>,
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
export class NoRouteEndPointFoundError extends Error {
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

/**
 * Converts a complex feature (like a polygon or a multipolygon) to a point. The result is the nearest point to
 * the target, which is basically the nearest part of a, say, building.
 * There may be corner cases to this algorithm: for example, the result point may turn out to be not the
 * entrance to the building but just its wall or a corner.
 * TODO also should look into this https://github.com/Turfjs/turf/issues/252#issuecomment-520502653
 */
export const findNearestPoint = (place: AnyPlace, target: PointPlace): PointPlace => {
    if (isPointFeature(place)) {
        return place;
    }

    return nearestPoint(target, explode(place));
};

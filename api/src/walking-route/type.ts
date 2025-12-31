import { type PointType } from "./const";
import { type WalkingRouteStateAnnotation } from "./util";

export type BoundingBox = [
    minLongitude: number,
    minLatitude: number,
    maxLongitude: number,
    maxLatitude: number,
];

export type Coordinates = [longitude: number, latitude: number];

export type Isochrone = {
    boundingBox: BoundingBox;
    coordinates: number[][];
};

export type ORSIsochroneRequest = {
    locations: Coordinates[];
    range: [number, number];
};

export type ORSIsochroneResponse = {
    bbox: BoundingBox;
    features: ORSFeature[];
};

export type OverpassInstanceElement = {
    id: number;
    lat: number;
    lon: number;
    tags: {
        "addr:housenumber"?: string;
        "addr:street"?: string;
        amenity: string;
        name?: string;
    };
    type: PointType;
};

export type OverpassInstanceRequest = {
    data: string;
};

export type OverpassInstanceResponse = {
    elements: OverpassInstanceElement[];
};

export type Point = {
    coordinates: Coordinates;
    id: number;
    info?: {
        description?: string;
        name?: string;
    };
    type: PointType;
};

export type Route = Point[];

export type WalkingRouteState = typeof WalkingRouteStateAnnotation.State;

type ORSFeature = {
    geometry: {
        coordinates: number[][][];
    };
    value: number;
};

import { type RouteGeneratorStateAnnotation } from "./util";

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
    long: number;
    tags: {
        "addr:housenumber"?: string;
        "addr:street"?: string;
        amenity: string;
        name?: string;
    };
    type: OverpassType;
};

export type OverpassInstanceRequest = {
    data: string;
};

export type OverpassInstanceResponse = {
    elements: OverpassInstanceElement[];
};

export type OverpassType = "node" | "relation" | "way";

export type Point = {
    coordinates: Coordinates;
    info?: {
        description?: string;
        name?: string;
    };
    type: OverpassType;
};

export type Route = Point[];

export type RouteGeneratorState = typeof RouteGeneratorStateAnnotation.State;

type BoundingBox = [number, number, number, number];

type ORSFeature = {
    geometry: {
        coordinates: number[][][];
    };
    value: number;
};

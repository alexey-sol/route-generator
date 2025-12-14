import { type RouteGeneratorStateAnnotation } from "./util";

export type Coordinates = [longitude: number, latitude: number];

export type Isochrone = {
    features: [IsochroneFeature, IsochroneFeature];
};

export type IsochroneFeature = {
    geometry: {
        coordinates: number[][];
    };
    value: number;
};

export type NumberRange = [min: number, max: number];

export type OverpassFeature = {
    geometry: {
        coordinates: number[];
        type: string;
    };
    id: string;
    properties: {
        "addr:floor": string;
        "addr:housenumber": string;
        "addr:street": string;
        amenity: string;
        name: string;
    };
};

export type OverpassResponse = {
    features: OverpassFeature[];
};

export type Route = [StartPoint, ...OverpassFeature[]];

export type RouteGeneratorState = typeof RouteGeneratorStateAnnotation.State;

export type StartPoint = Pick<OverpassFeature, "geometry">;

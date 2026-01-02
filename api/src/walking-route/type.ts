import { type WalkingRouteStateAnnotation } from "./util";
import {
    type Feature,
    type FeatureCollection,
    type Geometry,
    type MultiPolygon,
    type Point,
    type Polygon,
    type Position,
} from "geojson";

export type AnyPlace = Feature<Geometry, FeatureProperties | null>;

export type BoundingBox = [
    minLongitude: number,
    minLatitude: number,
    maxLongitude: number,
    maxLatitude: number,
];

export type Coordinates = [longitude: number, latitude: number];

export type Isochrone = FeatureCollection<Polygon>;

export type MultiPolygonPlace = Feature<MultiPolygon>;

export type ORSIsochroneRequest = {
    locations: Position[];
    range: [number, number];
};

export type ORSIsochroneResponse = FeatureCollection<Polygon>;

export type OverpassInstanceRequest = {
    data: string;
};

export type OverpassInstanceResponse = {
    elements: OverpassInstanceElement[];
};

export type PointPlace = Feature<Point>;

export type PolygonPlace = Feature<Polygon>;

export type Route = AnyPlace[];

export type WalkingRouteState = typeof WalkingRouteStateAnnotation.State;

type FeatureProperties = {
    [name: string]: unknown;
    "addr:housenumber"?: string;
    "addr:street"?: string;
    amenity?: string;
    id?: string;
    name?: string;
    official_name?: string;
};

type OSMFeatureType = "node" | "relation" | "way";

type OverpassInstanceElement = {
    id: number;
    lat: number;
    lon: number;
    tags: {
        "addr:housenumber"?: string;
        "addr:street"?: string;
        amenity: string;
        name?: string;
    };
    type: OSMFeatureType;
};

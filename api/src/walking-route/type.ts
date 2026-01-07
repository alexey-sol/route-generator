import { type WalkingRouteStateAnnotation } from "./util";
import { type MessageStructure, type MessageType } from "@langchain/core/messages";
import {
    type Feature,
    type FeatureCollection,
    type Geometry,
    type LineString,
    type MultiPolygon,
    type Point,
    type Polygon,
    type Position,
} from "geojson";
import { type BaseMessage } from "langchain";

export type AnyPlace = Feature<Geometry, FeatureProperties | null>;

export type Isochrone = FeatureCollection<Polygon>;

export type MultiPolygonPlace = Feature<MultiPolygon>;

export type OpenAiResponse = {
    messages: Array<BaseMessage<MessageStructure, MessageType>>;
};

export type ORSDirectionRequest = {
    coordinates: Position[];
    instructions?: boolean;
    language?: string;
};

export type ORSDirectionResponse = FeatureCollection<
    LineString,
    {
        segments: ORSDirectionSegment[];
    }
>;

export type ORSIsochroneRequest = {
    locations: Position[];
    range: [number, number];
};

export type OverpassInstanceRequest = {
    data: string;
};

export type OverpassInstanceResponse = {
    elements: OverpassInstanceElement[];
};

export type PointPlace = Feature<Point>;

export type PolygonPlace = Feature<Polygon>;

export type Route = {
    points: PointPlace[];
    waypoints: Position[];
};

export type WalkingRouteState = typeof WalkingRouteStateAnnotation.State;

type FeatureProperties = {
    [name: string]: unknown;
    "addr:housenumber"?: string;
    "addr:street"?: string;
    amenity?: string;
    id?: string;
    name?: string;
    official_name?: string;
    teaser?: string;
};

type ORSDirectionSegment = {
    distance: number;
    duration: number;
    steps: ORSDirectionSegmentStep[];
};

type ORSDirectionSegmentStep = Pick<ORSDirectionSegment, "distance" | "duration"> & {
    instruction?: string;
    name?: string;
    type: number;
    way_points: [from: number, to: number];
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

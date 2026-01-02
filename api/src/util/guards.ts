import { type Feature, type MultiPolygon, type Point, type Polygon } from "geojson";

export const isPointFeature = (item: Feature): item is Feature<Point> =>
    item.geometry.type === "Point";

export const isPolygonFeature = (item: Feature): item is Feature<Polygon> =>
    item.geometry.type === "Polygon";

export const isMultiPolygonFeature = (item: Feature): item is Feature<MultiPolygon> =>
    item.geometry.type === "MultiPolygon";

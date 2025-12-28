import { PointType } from "@/route-generator/const";
import { type Coordinates, type Point } from "@/route-generator/type";

const isNumber = (item: unknown): item is number => typeof item === "number";

const isCoordinates = (item: unknown): item is Coordinates =>
    item instanceof Array && item.length === 2 && item.every(isNumber);

const hasPointCoordinates = (item: object): item is { coordinates: Point["coordinates"] } =>
    "coordinates" in item && isCoordinates(item.coordinates);

const hasPointType = (item: object): item is { type: Point["type"] } =>
    "type" in item &&
    typeof item.type === "string" &&
    Object.values(PointType).includes(item.type as PointType);

export const isPoint = (item: unknown): item is Point =>
    item instanceof Object && hasPointCoordinates(item) && hasPointType(item);

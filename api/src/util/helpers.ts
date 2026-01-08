import { isMultiPolygonFeature, isPointFeature, isPolygonFeature } from "./guards";
import { type AnyPlace, type PointPlace } from "@/walking-route/type";
import { distance, pointToPolygonDistance, type Units } from "@turf/turf";

/**
 * Picks a number of elements (elementsToPick) from the array evenly but with an offset (if jitterRange is
 * greater than default 1).
 * Jitter may produce duplicate elements in the result array.
 */
export const pickEvenlyWithJitter = <T>(
    array: T[],
    elementsToPick: number,
    jitterRange = 1,
): T[] => {
    if (elementsToPick <= 0) {
        return [];
    }

    if (elementsToPick === 1) {
        return [array[0]];
    }

    if (elementsToPick >= array.length) {
        return [...array];
    }

    const step = (array.length - 1) / (elementsToPick - 1);

    return Array.from({ length: elementsToPick }, (_, index) => {
        const evenIndex = Math.round(index * step);
        const offset = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange;
        const jitteredIndex = Math.max(0, Math.min(array.length - 1, evenIndex + offset));

        return array[jitteredIndex];
    });
};

export const getDistance = (from: PointPlace, to: AnyPlace, units: Units): number => {
    try {
        if (isPointFeature(to)) {
            return distance(from, to, { units });
        } else if (isPolygonFeature(to) || isMultiPolygonFeature(to)) {
            return pointToPolygonDistance(from, to, { units });
        }
    } catch (error) {
        console.error(error);
    }

    return 0;
};

export const range = (start: number, end: number, step = 1) => {
    const length = Math.ceil((end - start) / step);

    return Array.from({ length }, (_, index) => start + index * step);
};

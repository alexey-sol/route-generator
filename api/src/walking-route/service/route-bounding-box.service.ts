import { type AnyPlace, type PointPlace, type WalkingRouteState } from "../type";
import { findNearestPoint } from "../util";
import { getDistance } from "@/util/helpers";
import { Injectable } from "@nestjs/common";
import { bbox, bboxPolygon, booleanIntersects, featureCollection, Units } from "@turf/turf";

const DEFAULT_DISTANCE = 0;
const DISTANCE_UNITS: Units = "meters";
const ANGLE_UNITS: Units = "radians";

@Injectable()
export class RouteBoundingBoxService {
    filterPlacesOutsideBoundingBox = ({
        endPoint,
        placesOfInterest,
        startPoint,
    }: Pick<
        WalkingRouteState,
        "endPoint" | "placesOfInterest" | "startPoint"
    >): WalkingRouteState["placesOfInterest"] => {
        const routeBoundingBox = bbox(featureCollection([startPoint, endPoint]));

        const routablePlaces = placesOfInterest.filter((place) => {
            return (
                this.isValidDistance(startPoint, place) &&
                booleanIntersects(place, bboxPolygon(routeBoundingBox))
            );
        });

        return routablePlaces.toSorted(this.sortPlacesByDistanceTo(startPoint));
    };

    findEndPoint = ({
        placesOfInterest,
        startPoint,
    }: Pick<WalkingRouteState, "placesOfInterest" | "startPoint">): null | PointPlace => {
        let maxDistance = DEFAULT_DISTANCE;
        let baseEndPoint: AnyPlace | null = null;

        for (const place of placesOfInterest) {
            const fromToDistance = getDistance(startPoint, place, DISTANCE_UNITS);

            if (fromToDistance > maxDistance) {
                maxDistance = fromToDistance;
                baseEndPoint = place;
            }
        }

        return baseEndPoint && findNearestPoint(baseEndPoint, startPoint);
    };

    /**
     * In the case of an invalid geoJSON feature, the measured distance will be 0. It's better to filter such
     * elements out.
     */
    private isValidDistance = (from: PointPlace, to: AnyPlace) => {
        return getDistance(from, to, ANGLE_UNITS) !== DEFAULT_DISTANCE;
    };

    private sortPlacesByDistanceTo = (target: PointPlace) => {
        return (a, b) => getDistance(target, a, ANGLE_UNITS) - getDistance(target, b, ANGLE_UNITS);
    };
}

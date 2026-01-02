import { type AnyPlace, type PointPlace, type WalkingRouteState } from "../type";
import { getDistance } from "@/util/helpers";
import { Injectable } from "@nestjs/common";
import { bbox, bboxPolygon, booleanIntersects, featureCollection, Units } from "@turf/turf";

const DEFAULT_DISTANCE = 0;
const DISTANCE_UNITS: Units = "meters";
const ANGLE_UNITS: Units = "radians";

@Injectable()
export class RouteBoundingBoxService {
    filterPlacesOutsideBoundingBox = ({
        endPlace,
        placesOfInterest,
        startPlace,
    }: Pick<
        WalkingRouteState,
        "endPlace" | "placesOfInterest" | "startPlace"
    >): WalkingRouteState["placesOfInterest"] => {
        const routeBoundingBox = bbox(featureCollection([startPlace, endPlace]));

        const routablePlaces = placesOfInterest.filter((place) => {
            return (
                this.isValidDistance(startPlace, place) &&
                booleanIntersects(place, bboxPolygon(routeBoundingBox))
            );
        });

        return routablePlaces.toSorted(this.sortPlacesByDistanceTo(startPlace));
    };

    findEndPlace = ({
        placesOfInterest,
        startPlace,
    }: Pick<WalkingRouteState, "placesOfInterest" | "startPlace">): AnyPlace | null => {
        let maxDistance = DEFAULT_DISTANCE;
        let endPlace: AnyPlace | null = null;

        for (const place of placesOfInterest) {
            const fromToDistance = getDistance(startPlace, place, DISTANCE_UNITS);

            if (fromToDistance > maxDistance) {
                maxDistance = fromToDistance;
                endPlace = place;
            }
        }

        return endPlace;
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

import { BoundingBox, Coordinates, Point, WalkingRouteState } from "../type";
import { isCoordinates } from "@/util/guards";
import { Injectable } from "@nestjs/common";
import {
    bbox,
    bboxPolygon,
    distance,
    featureCollection,
    lineString,
    point,
    pointsWithinPolygon,
    Units,
} from "@turf/turf";

const DISTANCE_UNITS: Units = "meters";
const ANGLE_UNITS: Units = "radians";

@Injectable()
export class RouteBoundingBoxService {
    filterPointsOutsideBoundingBox = ({
        endPoint,
        pointsOfInterest,
        startPoint,
    }: Pick<WalkingRouteState, "endPoint" | "pointsOfInterest" | "startPoint">): Point[] => {
        const boundingBox = this.getBoundingBox({ endPoint, startPoint });
        // TODO it may not work when dealing with a way or a relation
        const mapCoordinatesToPoint: Map<Point["coordinates"], Point> = new Map();

        for (const pt of pointsOfInterest) {
            mapCoordinatesToPoint.set(pt.coordinates, pt);
        }

        const points = featureCollection(pointsOfInterest.map((pt) => point(pt.coordinates)));
        const polygon = bboxPolygon(boundingBox);
        const pointsInside = pointsWithinPolygon(points, polygon);

        const sortedFeatures = pointsInside.features.toSorted(
            this.sortFeaturesByDistanceTo(startPoint.coordinates),
        );

        return this.mapPointsOfInterest(mapCoordinatesToPoint, sortedFeatures);
    };

    findRouteEndPoint = ({
        pointsOfInterest,
        startPoint,
    }: Pick<WalkingRouteState, "pointsOfInterest" | "startPoint">): null | Point => {
        let maxDistance = 0;
        let routeEndPoint: null | Point = null;

        const from = point(startPoint.coordinates);

        for (const item of pointsOfInterest) {
            if (item.type === "node") {
                const to = point(item.coordinates);

                const fromToDistance = distance(from, to, { units: DISTANCE_UNITS });

                if (fromToDistance > maxDistance) {
                    maxDistance = fromToDistance;
                    routeEndPoint = item;
                }
            }
        }

        return routeEndPoint;
    };

    private getBoundingBox = ({
        endPoint,
        startPoint,
    }: Pick<WalkingRouteState, "endPoint" | "startPoint">): BoundingBox => {
        const points = lineString([startPoint.coordinates, endPoint.coordinates]);

        return bbox(points) as BoundingBox;
    };

    private mapPointsOfInterest = (
        mapCoordinatesToPoint: Map<Point["coordinates"], Point>,
        features: ReturnType<typeof pointsWithinPolygon>["features"],
    ): Point[] => {
        const points: Point[] = [];

        for (const feature of features) {
            if (isCoordinates(feature.geometry.coordinates)) {
                const pt = mapCoordinatesToPoint.get(feature.geometry.coordinates);

                if (pt) {
                    points.push(pt);
                }
            }
        }

        return points;
    };

    private sortFeaturesByDistanceTo = (target: Coordinates) => {
        return (a, b) =>
            distance(target, a, { units: ANGLE_UNITS }) -
            distance(target, b, { units: ANGLE_UNITS });
    };
}

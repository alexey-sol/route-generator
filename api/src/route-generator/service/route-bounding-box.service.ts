import { BoundingBox, Point, RouteGeneratorState } from "../type";
import { Injectable } from "@nestjs/common";
import { bbox, distance, lineString, point, Units } from "@turf/turf";

const DISTANCE_UNITS: Units = "meters";

@Injectable()
export class RouteBoundingBoxService {
    findRouteEndPoint = ({
        pointsOfInterest,
        startPoint,
    }: Pick<RouteGeneratorState, "pointsOfInterest" | "startPoint">): null | Point => {
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

    getBoundingBox = ({
        endPoint,
        startPoint,
    }: Pick<RouteGeneratorState, "endPoint" | "startPoint">): BoundingBox => {
        const points = lineString([startPoint.coordinates, endPoint.coordinates]);

        return bbox(points) as BoundingBox;
    };
}

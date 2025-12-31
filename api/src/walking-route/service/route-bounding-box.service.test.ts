import { type WalkingRouteState } from "../type";
import { NodePoint, RelationPoint } from "../util";
import { RouteBoundingBoxService } from "./route-bounding-box.service";

const START_POINT = new NodePoint([1, 2]);

type StateSlice = Pick<WalkingRouteState, "pointsOfInterest" | "startPoint">;

describe("RouteBoundingBoxService", () => {
    let service: RouteBoundingBoxService;

    beforeEach(() => {
        service = new RouteBoundingBoxService();
    });

    describe("findRouteEndPoint", () => {
        it("returns farthest point from startPoint", async () => {
            const POINT_1 = new NodePoint([0.1, 5.3]);
            const POINT_2 = new NodePoint([1.1, 5.4]);
            const POINT_3 = new NodePoint([4.2, 0.2]);
            const POINT_4 = new NodePoint([4.3, 2.2]);

            const state: StateSlice = {
                pointsOfInterest: [POINT_1, POINT_2, POINT_3, POINT_4],
                startPoint: START_POINT,
            };

            const result = service.findRouteEndPoint(state);

            expect(result).toBe(POINT_3);
        });

        it("returns null when pointsOfInterest is empty", async () => {
            const state: StateSlice = {
                pointsOfInterest: [],
                startPoint: START_POINT,
            };

            const result = service.findRouteEndPoint(state);

            expect(result).toBe(null);
        });

        it("returns null when pointsOfInterest has only startPoint item", async () => {
            const state: StateSlice = {
                pointsOfInterest: [START_POINT],
                startPoint: START_POINT,
            };

            const result = service.findRouteEndPoint(state);

            expect(result).toBe(null);
        });

        it("returns null when pointsOfInterest has no node points", async () => {
            const state: StateSlice = {
                pointsOfInterest: [new RelationPoint([0.1, 2.3]), new RelationPoint([1.1, 2.4])],
                startPoint: START_POINT,
            };

            const result = service.findRouteEndPoint(state);

            expect(result).toBe(null);
        });
    });
});

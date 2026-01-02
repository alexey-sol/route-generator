import { type WalkingRouteState } from "../type";
import { getMultiPolygonPlace, getPointPlace, getPolygonPlace } from "../util";
import { RouteBoundingBoxService } from "./route-bounding-box.service";

const START_POINT = getPointPlace([1, 2]);

type StateSlice = Pick<WalkingRouteState, "placesOfInterest" | "startPlace">;

describe("RouteBoundingBoxService", () => {
    let service: RouteBoundingBoxService;

    beforeEach(() => {
        service = new RouteBoundingBoxService();
    });

    describe("findEndPlace", () => {
        it("returns farthest place from startPlace", () => {
            const PLACE_1 = getPointPlace([0.1, 5.3]);
            const PLACE_2 = getPolygonPlace([
                [[1.1, 5.4], [1.2, 5.5], [1.3, 5.6], [1.1, 5.4]], // eslint-disable-line prettier/prettier
                [[1.1, 5.4], [1.2, 5.6], [1.3, 5.5], [1.1, 5.4]], // eslint-disable-line prettier/prettier
            ]);
            const PLACE_3 = getMultiPolygonPlace([
                [
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                ],
                [
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                    [[5.2, 0.2], [5.3, 5.5], [5.3, 5.6], [5.2, 0.2]], // eslint-disable-line prettier/prettier
                ],
            ]);
            const PLACE_4 = getPointPlace([4.3, 2.2]);

            const state: StateSlice = {
                placesOfInterest: [PLACE_1, PLACE_2, PLACE_3, PLACE_4],
                startPlace: START_POINT,
            };

            expect(service.findEndPlace(state)).toBe(PLACE_3);
        });

        it("returns null when placesOfInterest is empty", () => {
            const state: StateSlice = {
                placesOfInterest: [],
                startPlace: START_POINT,
            };

            expect(service.findEndPlace(state)).toBe(null);
        });

        it("returns null when placesOfInterest has only startPlace item", () => {
            const state: StateSlice = {
                placesOfInterest: [START_POINT],
                startPlace: START_POINT,
            };

            expect(service.findEndPlace(state)).toBe(null);
        });
    });
});

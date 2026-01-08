import { type AnyPlace, type PointPlace } from "../type";
import { NotUniqueRouteError } from "../util";
import { RouteGeneratorService } from "./route-generator.service";
import { pickEvenlyWithJitter, range } from "@/util/helpers";

jest.mock("@/util/helpers");

const mockedPick = jest.mocked(pickEvenlyWithJitter);

const getId = ({ id }: AnyPlace) => id;

const getPoint = (id: number): PointPlace => ({
    geometry: { coordinates: [], type: "Point" },
    id,
    properties: { id },
    type: "Feature",
});

const TRAVEL_TIME_IN_SEC = 3_600;
const startPoint = getPoint(1);
const endPoint = getPoint(100);
const placesOfInterest = range(2, 100)?.map((id) => getPoint(id)); // [id = 2, id = 99]

describe("RouteGeneratorService", () => {
    let service: RouteGeneratorService;

    beforeEach(() => {
        service = new RouteGeneratorService();
    });

    describe("generateRoutes", () => {
        it("returns 3 unique routes with added start and end points", () => {
            const ROUTE_COUNT = 3;
            const PICKED: PointPlace[][] = [
                [getPoint(10), getPoint(40), getPoint(80)],
                [getPoint(20), getPoint(50), getPoint(90)],
                [getPoint(15), getPoint(45), getPoint(85)],
            ];

            mockedPick
                .mockReturnValueOnce(PICKED[0])
                .mockReturnValueOnce(PICKED[1])
                .mockReturnValue(PICKED[2]);

            const result = service.generateRoutes({
                endPoint,
                placesOfInterest,
                routeCount: ROUTE_COUNT,
                startPoint,
                travelTimeInSec: TRAVEL_TIME_IN_SEC,
            });

            result.forEach(({ points }, index) => {
                const resultIds = points.map(getId);
                const expectedIds = [startPoint.id, ...PICKED[index].map(getId), endPoint.id];

                expect(resultIds).toEqual(expectedIds);
            });
        });

        it("returns 1 unique route on 3rd try", () => {
            const ROUTE_COUNT = 1;
            const DUPLICATE_POINTS: PointPlace[] = [getPoint(10), getPoint(10), getPoint(90)];
            const DUPLICATE_END_POINT: PointPlace[] = [getPoint(10), getPoint(40), endPoint];
            const VALID_POINTS: PointPlace[] = [getPoint(10), getPoint(40), getPoint(90)];

            mockedPick
                .mockReturnValueOnce(DUPLICATE_POINTS)
                .mockReturnValueOnce(DUPLICATE_END_POINT)
                .mockReturnValue(VALID_POINTS);

            const result = service.generateRoutes({
                endPoint,
                placesOfInterest,
                routeCount: ROUTE_COUNT,
                startPoint,
                travelTimeInSec: TRAVEL_TIME_IN_SEC,
            });

            const { points = [] } = result[0] ?? {};
            const resultIds = points.map(getId);
            const expectedIds = [startPoint.id, ...VALID_POINTS.map(getId), endPoint.id];

            expect(resultIds).toEqual(expectedIds);
        });

        it("throws NotUniqueRouteError if could not generate unique route", () => {
            const ROUTE_COUNT = 3;
            const PICKED: PointPlace[][] = [
                [getPoint(10), getPoint(40), getPoint(80)],
                [getPoint(20), getPoint(50), getPoint(90)],
                [getPoint(20), getPoint(45), getPoint(85)],
            ];

            mockedPick
                .mockReturnValueOnce(PICKED[0])
                .mockReturnValueOnce(PICKED[1])
                .mockReturnValue(PICKED[2]);

            expect(() =>
                service.generateRoutes({
                    endPoint,
                    placesOfInterest,
                    routeCount: ROUTE_COUNT,
                    startPoint,
                    travelTimeInSec: TRAVEL_TIME_IN_SEC,
                }),
            ).toThrow(NotUniqueRouteError);
        });

        it("throws NotUniqueRouteError if generated route has duplicates", () => {
            const ROUTE_COUNT = 1;
            const PICKED: PointPlace[] = [getPoint(10), getPoint(10), getPoint(80)];

            mockedPick.mockReturnValue(PICKED);

            expect(() =>
                service.generateRoutes({
                    endPoint,
                    placesOfInterest,
                    routeCount: ROUTE_COUNT,
                    startPoint,
                    travelTimeInSec: TRAVEL_TIME_IN_SEC,
                }),
            ).toThrow(NotUniqueRouteError);
        });

        it("throws NotUniqueRouteError if generated route has duplicate end point", () => {
            const ROUTE_COUNT = 1;
            const PICKED: PointPlace[] = [getPoint(10), getPoint(40), endPoint];

            mockedPick.mockReturnValue(PICKED);

            expect(() =>
                service.generateRoutes({
                    endPoint,
                    placesOfInterest,
                    routeCount: ROUTE_COUNT,
                    startPoint,
                    travelTimeInSec: TRAVEL_TIME_IN_SEC,
                }),
            ).toThrow(NotUniqueRouteError);
        });
    });
});

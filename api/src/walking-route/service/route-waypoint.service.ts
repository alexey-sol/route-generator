import { ROUTE_PROFILE } from "../const";
import {
    type ORSDirectionRequest,
    type ORSDirectionResponse,
    type PointPlace,
    type Route,
    type WalkingRouteState,
} from "../type";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { AxiosError } from "axios";
import { type Position } from "geojson";
import pLimit from "p-limit";
import { catchError, firstValueFrom } from "rxjs";

const DIRECTION_FEATURE_INDEX = 0;
const REQUEST_CONCURRENCY_LIMIT = 3;

@Injectable()
export class RouteWaypointService {
    private readonly logger = new Logger(RouteWaypointService.name);

    constructor(private readonly httpService: HttpService) {}

    addRouteWaypoints = async ({
        language,
        routes,
    }: Pick<WalkingRouteState, "language" | "routes">): Promise<WalkingRouteState["routes"]> => {
        const limit = pLimit(REQUEST_CONCURRENCY_LIMIT);

        const tasks = routes.map(({ points }) => {
            return limit(async () => {
                const waypoints = await this.getRouteWaypoints(points, language);

                return { points, waypoints } satisfies Route;
            });
        });

        return Promise.all(tasks);
    };

    getRouteWaypoints = async (points: PointPlace[], language?: string): Promise<Position[]> => {
        const response = await this.fetchDirection(this.mapRequest(points, language));

        return this.mapResponse(response);
    };

    private async fetchDirection(request: ORSDirectionRequest): Promise<ORSDirectionResponse> {
        const { data } = await firstValueFrom(
            this.httpService
                .post<ORSDirectionResponse>(`/v2/directions/${ROUTE_PROFILE}/geojson`, request)
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(error.response?.data);
                        throw error;
                    }),
                ),
        );

        return data;
    }

    private mapRequest = (
        points: PointPlace[],
        language?: WalkingRouteState["language"],
    ): ORSDirectionRequest => ({
        coordinates: points.map((item) => item.geometry.coordinates),
        language,
    });

    private mapResponse = (response: ORSDirectionResponse): Position[] => {
        return response.features[DIRECTION_FEATURE_INDEX].geometry?.coordinates ?? [];
    };
}

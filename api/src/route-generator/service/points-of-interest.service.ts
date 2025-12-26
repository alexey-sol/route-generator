import {
    OverpassInstanceRequest,
    OverpassInstanceResponse,
    Point,
    RouteGeneratorState,
} from "../type";
import { AppConfig } from "@/config/config.type";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";

const OVERPASS_AMENITIES = ["police", "fire_station", "school"]; // TODO adjust
const OVERPASS_TIMEOUT_SEC = 60;

@Injectable()
export class PointsOfInterestService {
    private readonly logger = new Logger(PointsOfInterestService.name);

    constructor(
        private readonly configService: ConfigService<AppConfig, true>,
        private readonly httpService: HttpService,
    ) {}

    getPointsOfInterest = async (
        state: Pick<RouteGeneratorState, "isochrone">,
    ): Promise<Point[]> => {
        const response = await this.fetchPointsOfInterest(this.mapRequest(state));

        return this.mapResponse(response);
    };

    private async fetchPointsOfInterest(
        request: OverpassInstanceRequest,
    ): Promise<OverpassInstanceResponse> {
        const { endpoint } = this.configService.get("overpassInstance", { infer: true });

        const { data } = await firstValueFrom(
            this.httpService
                .get<OverpassInstanceResponse>(endpoint, {
                    params: request,
                })
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(error.response?.data);
                        throw error;
                    }),
                ),
        );

        return data;
    }

    private mapRequest = ({
        isochrone,
    }: Pick<RouteGeneratorState, "isochrone">): OverpassInstanceRequest => {
        const { boundingBox, coordinates } = isochrone;

        const overpassCoordinates = coordinates.map(([longitude, latitude]) => [
            latitude,
            longitude,
        ]);

        const [minLongitude, minLatitude, maxLongitude, maxLatitude] = boundingBox;
        const overpassBoundingBox = [minLatitude, minLongitude, maxLatitude, maxLongitude];
        const overpassBoundingBoxAsString = overpassBoundingBox.join(",");

        const overpassCoordinatesAsString = overpassCoordinates.flat().join(" ");
        const amenitiesAsRegExpString = OVERPASS_AMENITIES.join("|");

        return {
            data:
                `[bbox: ${overpassBoundingBoxAsString}]` +
                "[out:json]" +
                `[timeout:${OVERPASS_TIMEOUT_SEC}];` +
                `nwr[amenity~"${amenitiesAsRegExpString}"](poly:"${overpassCoordinatesAsString}");` +
                "out geom;",
        };
    };

    private mapResponse = (response: OverpassInstanceResponse): Point[] =>
        response.elements?.map((element) => ({
            coordinates: [element.long, element.lat],
            info: {
                name: element.tags.name,
            },
            type: element.type,
        }));
}

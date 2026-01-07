import {
    type OverpassInstanceRequest,
    type OverpassInstanceResponse,
    type WalkingRouteState,
} from "../type";
import { NoBoundingBoxProvidedError } from "../util";
import { AppConfig } from "@/config/config.type";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import osmtogeojson from "osmtogeojson";
import { catchError, firstValueFrom } from "rxjs";

const OVERPASS_AMENITIES = ["police", "fire_station", "school"]; // TODO adjust
const OVERPASS_TIMEOUT_SEC = 60;
const ISOCHRONE_FEATURES_INDEX = 0;
const ISOCHRONE_COORDINATES_INDEX = 0;

@Injectable()
export class PlacesOfInterestService {
    private readonly logger = new Logger(PlacesOfInterestService.name);

    constructor(
        private readonly configService: ConfigService<AppConfig, true>,
        private readonly httpService: HttpService,
    ) {}

    getPlacesOfInterest = async ({
        isochrone,
    }: Pick<WalkingRouteState, "isochrone">): Promise<WalkingRouteState["placesOfInterest"]> => {
        const response = await this.fetchPlacesOfInterest(this.mapRequest(isochrone));

        return this.mapResponse(response);
    };

    private async fetchPlacesOfInterest(
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

    private mapIsochrone = (isochrone: WalkingRouteState["isochrone"]) => ({
        boundingBox: isochrone.bbox,
        coordinates:
            isochrone?.features?.[ISOCHRONE_FEATURES_INDEX]?.geometry?.coordinates?.[
                ISOCHRONE_COORDINATES_INDEX
            ] ?? [],
    });

    private mapRequest = (isochrone: WalkingRouteState["isochrone"]): OverpassInstanceRequest => {
        const { boundingBox, coordinates } = this.mapIsochrone(isochrone);

        const overpassCoordinates = coordinates.map(([longitude, latitude]) => [
            latitude,
            longitude,
        ]);

        if (!boundingBox) {
            throw new NoBoundingBoxProvidedError();
        }

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

    private mapResponse = (
        response: OverpassInstanceResponse,
    ): WalkingRouteState["placesOfInterest"] => {
        return osmtogeojson(response)?.features ?? [];
    };
}

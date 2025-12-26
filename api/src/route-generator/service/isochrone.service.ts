import { Isochrone, ORSIsochroneRequest, ORSIsochroneResponse, RouteGeneratorState } from "../type";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";

const ISOCHRONE_FEATURES_INDEX = 0;
const ISOCHRONE_COORDINATES_INDEX = 0;

@Injectable()
export class IsochroneService {
    private readonly logger = new Logger(IsochroneService.name);

    constructor(private readonly httpService: HttpService) {}

    getIsochrone = async (
        state: Pick<RouteGeneratorState, "startPoint" | "travelTimeInSec">,
    ): Promise<Isochrone> => {
        const response = await this.fetchFootWalkingIsochrone(this.mapRequest(state));

        return this.mapResponse(response);
    };

    private async fetchFootWalkingIsochrone(
        request: ORSIsochroneRequest,
    ): Promise<ORSIsochroneResponse> {
        const { data } = await firstValueFrom(
            this.httpService
                .post<ORSIsochroneResponse>("/v2/isochrones/foot-walking", request)
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
        startPoint,
        travelTimeInSec,
    }: Pick<RouteGeneratorState, "startPoint" | "travelTimeInSec">): ORSIsochroneRequest => ({
        locations: [startPoint.coordinates],
        range: [travelTimeInSec, travelTimeInSec],
    });

    private mapResponse = (response: ORSIsochroneResponse): Isochrone => ({
        boundingBox: response.bbox,
        coordinates:
            response?.features?.[ISOCHRONE_FEATURES_INDEX]?.geometry?.coordinates?.[
                ISOCHRONE_COORDINATES_INDEX
            ] ?? [],
    });
}

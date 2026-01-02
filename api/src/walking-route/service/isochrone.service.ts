import {
    type Isochrone,
    type ORSIsochroneRequest,
    type ORSIsochroneResponse,
    type WalkingRouteState,
} from "../type";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";

@Injectable()
export class IsochroneService {
    private readonly logger = new Logger(IsochroneService.name);

    constructor(private readonly httpService: HttpService) {}

    getIsochrone = async (
        state: Pick<WalkingRouteState, "startPlace" | "travelTimeInSec">,
    ): Promise<Isochrone> => {
        return this.fetchFootWalkingIsochrone(this.mapRequest(state));
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
        startPlace,
        travelTimeInSec,
    }: Pick<WalkingRouteState, "startPlace" | "travelTimeInSec">): ORSIsochroneRequest => ({
        locations: [startPlace.geometry.coordinates],
        range: [travelTimeInSec, travelTimeInSec],
    });
}

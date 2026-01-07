import { ROUTE_PROFILE } from "../const";
import { type Isochrone, type ORSIsochroneRequest, type WalkingRouteState } from "../type";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";

@Injectable()
export class IsochroneService {
    private readonly logger = new Logger(IsochroneService.name);

    constructor(private readonly httpService: HttpService) {}

    getIsochrone = async (
        state: Pick<WalkingRouteState, "startPoint" | "travelTimeInSec">,
    ): Promise<Isochrone> => {
        return this.fetchIsochrone(this.mapRequest(state));
    };

    private async fetchIsochrone(request: ORSIsochroneRequest): Promise<Isochrone> {
        const { data } = await firstValueFrom(
            this.httpService.post<Isochrone>(`/v2/isochrones/${ROUTE_PROFILE}`, request).pipe(
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
    }: Pick<WalkingRouteState, "startPoint" | "travelTimeInSec">): ORSIsochroneRequest => ({
        locations: [startPoint.geometry.coordinates],
        range: [travelTimeInSec, travelTimeInSec],
    });
}

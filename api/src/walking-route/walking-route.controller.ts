import { WalkingRouteService } from "./walking-route.service";
import { Body, Controller, HttpCode, Optional, Post } from "@nestjs/common";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber } from "class-validator";

// TODO open api dto
export class GetRouteRequest {
    @IsNumber()
    @Optional()
    routeCount: number;

    @ArrayMaxSize(2)
    @ArrayMinSize(2)
    @IsArray()
    startCoordinates: [longitude: number, latitude: number];

    @IsNumber()
    travelTimeInSec: number;
}

@Controller("walking-route")
export class WalkingRouteController {
    constructor(private readonly service: WalkingRouteService) {}

    @HttpCode(200)
    @Post()
    async getRoutes(@Body() request: GetRouteRequest) {
        const response = await this.service.generateRoutes(
            request.startCoordinates,
            request.travelTimeInSec,
            request.routeCount,
        );

        return { response };
    }
}

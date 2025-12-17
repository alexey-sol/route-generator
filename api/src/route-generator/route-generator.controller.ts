import { RouteGeneratorService } from "./route-generator.service";
import { type Coordinates } from "./type";
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
    startCoordinates: Coordinates;

    @IsNumber()
    travelTimeInSec: number;
}

@Controller("route-generator")
export class RouteGeneratorController {
    constructor(private readonly service: RouteGeneratorService) {}

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

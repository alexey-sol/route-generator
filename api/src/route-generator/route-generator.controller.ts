import { RouteGenerator } from "./route-generator.service";
import { type Coordinates } from "./type";
import { Body, Controller, Optional, Post } from "@nestjs/common";
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

    @ArrayMaxSize(2)
    @ArrayMinSize(2)
    @IsArray()
    travelTimeRangeInSec: Coordinates;
}

@Controller("route-generator")
export class ChatModelController {
    constructor(private readonly service: RouteGenerator) {}

    @Post()
    async getRoutes(@Body() request: GetRouteRequest) {
        const response = await this.service.generateRoutes(
            request.startCoordinates,
            request.travelTimeRangeInSec,
            request.routeCount,
        );

        return { response };
    }
}

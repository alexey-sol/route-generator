import { DeleteRoutePointRequest, GetRouteRequest } from "./util";
import { WalkingRouteService } from "./walking-route.service";
import { Body, Controller, Delete, HttpCode, Post } from "@nestjs/common";

@Controller("walking-route")
export class WalkingRouteController {
    constructor(private readonly service: WalkingRouteService) {}

    @Delete("point")
    async deleteRoutePoint(@Body() request: DeleteRoutePointRequest) {
        const response = await this.service.deleteRoutePoint(request);

        return { response };
    }

    @HttpCode(200)
    @Post("routes")
    async getRoutes(@Body() request: GetRouteRequest) {
        const response = await this.service.generateRoutes(request);

        return { response };
    }
}

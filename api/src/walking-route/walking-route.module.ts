import { IsochroneService } from "./service/isochrone.service";
import { PlacePropertiesService } from "./service/place-properties.service";
import { PlacesOfInterestService } from "./service/places-of-interest.service";
import { RouteBoundingBoxService } from "./service/route-bounding-box.service";
import { RouteGeneratorService } from "./service/route-generator.service";
import { WalkingRouteController } from "./walking-route.controller";
import { WalkingRouteService } from "./walking-route.service";
import { ProcessConfigService } from "@/config/config.service";
import { AppConfig } from "@/config/config.type";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    controllers: [WalkingRouteController],
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AppConfig, true>) => {
                const { apiKey, baseUrl } = configService.get("openRouteService", { infer: true });

                return {
                    baseURL: baseUrl,
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                };
            },
        }),
    ],
    providers: [
        ProcessConfigService,
        WalkingRouteService,
        IsochroneService,
        PlacesOfInterestService,
        RouteBoundingBoxService,
        RouteGeneratorService,
        PlacePropertiesService,
    ],
})
export class WalkingRouteModule {}

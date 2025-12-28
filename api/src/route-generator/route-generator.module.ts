import { RouteGeneratorController } from "./route-generator.controller";
import { RouteGeneratorService } from "./route-generator.service";
import { IsochroneService } from "./service/isochrone.service";
import { PointsOfInterestService } from "./service/points-of-interest.service";
import { RouteBoundingBoxService } from "./service/route-bounding-box.service";
import { ProcessConfigService } from "@/config/config.service";
import { AppConfig } from "@/config/config.type";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    controllers: [RouteGeneratorController],
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
        RouteGeneratorService,
        ProcessConfigService,
        IsochroneService,
        PointsOfInterestService,
        RouteBoundingBoxService,
    ],
})
export class RouteGeneratorModule {}

import {
    gigachatConfig,
    openAiConfig,
    openRouteServiceConfig,
    processConfig,
} from "../config/config";
import { ProcessConfigService } from "../config/config.service";
import { validate } from "../config/env.validation";
import { RouteGeneratorModule } from "@/route-generator/route-generator.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
    controllers: [],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [processConfig, gigachatConfig, openAiConfig, openRouteServiceConfig],
            validate,
        }),
        RouteGeneratorModule,
    ],
    providers: [ProcessConfigService],
})
export class AppModule {}

import { gigachatConfig, openAiConfig, processConfig } from "../config/config";
import { ProcessConfigService } from "../config/config.service";
import { validate } from "../config/env.validation";
import { ChatModelController } from "../route-generator/route-generator.controller";
import { RouteGenerator } from "../route-generator/route-generator.service";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
    controllers: [ChatModelController],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [processConfig, gigachatConfig, openAiConfig],
            validate,
        }),
    ],
    providers: [RouteGenerator, ProcessConfigService],
})
export class AppModule {}

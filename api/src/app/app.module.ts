import { ChatModelController } from "../chat-model/chat-model.controller";
import { ChatModelService } from "../chat-model/chat-model.service";
import { gigachatConfig, processConfig } from "../config/config";
import { ProcessConfigService } from "../config/config.service";
import { validate } from "../config/env.validation";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
    controllers: [ChatModelController],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [processConfig, gigachatConfig],
            validate,
        }),
    ],
    providers: [ChatModelService, ProcessConfigService],
})
export class AppModule {}

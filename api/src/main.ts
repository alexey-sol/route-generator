import "dotenv/config";
import "./util/instrumentaion";
import { AppModule } from "./app/app.module";
import { NestFactory } from "@nestjs/core";

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3_000);
};

bootstrap();

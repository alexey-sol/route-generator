import "dotenv/config";
import "reflect-metadata";
import "./util/instrumentaion";
import { AppModule } from "./app/app.module";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(process.env.PORT ?? 3_000);
};

bootstrap();

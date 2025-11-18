import { type Environment } from "./config.const";
import { env as environment } from "./env.validation";
import { registerAs } from "@nestjs/config";

type GigachatConfig = {
    apiKey: string;
    model: string;
};

export const gigachatConfig = registerAs(
    "gigachat",
    (): GigachatConfig => ({
        apiKey: environment.GIGACHAT_API_KEY,
        model: environment.GIGACHAT_MODEL,
    }),
);

type ProcessConfig = {
    appName: string;
    environment: Environment;
};

export const processConfig = registerAs(
    "process",
    (): ProcessConfig => ({
        appName: environment.APP_NAME,
        environment: environment.NODE_ENV,
    }),
);

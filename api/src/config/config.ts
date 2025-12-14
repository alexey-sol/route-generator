import { type Environment } from "./config.const";
import { env as environment } from "./env.validation";
import { registerAs } from "@nestjs/config";

type BaseChatConfig = {
    apiKey: string;
    model: string;
};

export const gigachatConfig = registerAs(
    "gigachat",
    (): BaseChatConfig => ({
        apiKey: environment.GIGACHAT_API_KEY,
        model: environment.GIGACHAT_MODEL,
    }),
);

type OpenAiConfig = BaseChatConfig & {
    baseUrl: string;
};

export const openAiConfig = registerAs(
    "openAi",
    (): OpenAiConfig => ({
        apiKey: environment.OPENAI_API_KEY,
        baseUrl: environment.OPENAI_BASE_URL,
        model: environment.OPENAI_MODEL,
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

import { type gigachatConfig, type openAiConfig, type processConfig } from "./config";

export type AppConfig = {
    gigachat: ReturnType<typeof gigachatConfig>;
    openAi: ReturnType<typeof openAiConfig>;
    process: ReturnType<typeof processConfig>;
};

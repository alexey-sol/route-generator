import {
    type gigachatConfig,
    type openAiConfig,
    type openRouteServiceConfig,
    type processConfig,
} from "./config";

export type AppConfig = {
    gigachat: ReturnType<typeof gigachatConfig>;
    openAi: ReturnType<typeof openAiConfig>;
    openRouteService: ReturnType<typeof openRouteServiceConfig>;
    process: ReturnType<typeof processConfig>;
};

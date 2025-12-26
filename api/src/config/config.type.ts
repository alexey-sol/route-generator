import {
    type gigachatConfig,
    type openAiConfig,
    type openRouteServiceConfig,
    type overpassInstanceConfig,
    type processConfig,
} from "./config";

export type AppConfig = {
    gigachat: ReturnType<typeof gigachatConfig>;
    openAi: ReturnType<typeof openAiConfig>;
    openRouteService: ReturnType<typeof openRouteServiceConfig>;
    overpassInstance: ReturnType<typeof overpassInstanceConfig>;
    process: ReturnType<typeof processConfig>;
};

import { type gigachatConfig, type processConfig } from "./config";

export type AppConfig = {
    gigachat: ReturnType<typeof gigachatConfig>;
    process: ReturnType<typeof processConfig>;
};

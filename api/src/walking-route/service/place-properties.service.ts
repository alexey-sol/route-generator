import { MODEL_TEMPERATURE } from "../const";
import { AnyPlace, Route, WalkingRouteState } from "../type";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { ChatOpenAI } from "@langchain/openai";
import { CallbackHandler } from "@langfuse/langchain";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { createAgent, HumanMessage, ReactAgent, SystemMessage } from "langchain";
import pLimit from "p-limit";
import { AppConfig } from "src/config/config.type";

const INVOKE_CONCURRENCY_LIMIT = 5;
const SYSTEM_PROMPT =
    "You'll get a location name. With this name, come up with a teaser message to describe the location. The teaser should feel calm and mysterious, but it shouldn't be more than 10 words";

@Injectable()
export class PlacePropertiesService {
    private readonly agent: ReactAgent;

    private readonly logger = new Logger(PlacePropertiesService.name);

    constructor(configService: ConfigService<AppConfig, true>) {
        const { apiKey, baseUrl, model } = configService.get("openAi", { infer: true });

        const chatModel = new ChatOpenAI({
            configuration: {
                apiKey,
                baseURL: baseUrl,
            },
            model,
            temperature: MODEL_TEMPERATURE,
        });

        this.agent = createAgent({
            model: chatModel,
            systemPrompt: SYSTEM_PROMPT,
        });
    }

    addPlaceTeasers = async ({
        language,
        routes,
    }: Pick<WalkingRouteState, "language" | "routes">): Promise<WalkingRouteState["routes"]> => {
        const langfuseHandler = new CallbackHandler({
            sessionId: randomUUID(),
            tags: ["addPlaceTeasers"],
        }) as BaseCallbackHandler;

        const placePool = this.getDistinctPlacePool(routes);

        const limit = pLimit(INVOKE_CONCURRENCY_LIMIT);

        const tasks = placePool.map((item) =>
            limit(async () => {
                const name = item.properties?.official_name || item.properties?.name;

                if (!name) {
                    return item;
                }

                const response = await this.agent.invoke(
                    {
                        messages: [
                            // TODO + use amenity/place type to generate teaser, also should generate teaser for place with empty name
                            new SystemMessage(`Respond in this language: ${language}`),
                            new HumanMessage(name),
                        ],
                    },
                    { callbacks: [langfuseHandler] },
                );

                const teaser = response.messages.at(-1)?.content;

                return {
                    ...item,
                    properties: {
                        ...item.properties,
                        teaser: typeof teaser === "string" ? teaser : undefined,
                    },
                };
            }),
        );

        const updatedPlacePool = await Promise.all(tasks);

        return this.mapRoutes(routes, updatedPlacePool);
    };

    private getDistinctPlacePool = (routes: Route[]): AnyPlace[] => {
        const omitStartPlace = (route: Route) => route.slice(1);
        const placePool = routes.flatMap(omitStartPlace);

        return [...new Map(placePool.map((item) => [item.id, item])).values()];
    };

    private mapRoutes = (routes: Route[], placePool: AnyPlace[]): Route[] => {
        const mapIdToPlace: Record<number, AnyPlace> = {};

        for (const place of placePool) {
            if (place.id) {
                mapIdToPlace[place.id] = place;
            }
        }

        return routes.map((route) => {
            return route.map((place) => ({
                ...place,
                properties: place.id ? mapIdToPlace[place.id]?.properties : place.properties,
            }));
        });
    };
}

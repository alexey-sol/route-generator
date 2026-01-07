import { MODEL_TEMPERATURE } from "../const";
import { type OpenAiResponse, type PointPlace, type Route, type WalkingRouteState } from "../type";
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
const TEASER_DELIMITER = ". ";

@Injectable()
export class RoutePointPropertiesService {
    private readonly agent: ReactAgent;

    private readonly logger = new Logger(RoutePointPropertiesService.name);

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

    addPointTeasers = async ({
        language,
        routes,
    }: Pick<WalkingRouteState, "language" | "routes">): Promise<WalkingRouteState["routes"]> => {
        const langfuseHandler = new CallbackHandler({
            sessionId: randomUUID(),
            tags: ["addPointTeasers"],
        }) as BaseCallbackHandler;

        const pointPool = this.getDistinctPointPool(routes);

        const limit = pLimit(INVOKE_CONCURRENCY_LIMIT);

        const tasks = pointPool.map((item) => {
            return limit(async () => {
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

                return this.mapResponse(response, item);
            });
        });

        const updatedPointPool = await Promise.all(tasks);

        return this.mapRoutes(routes, updatedPointPool);
    };

    private getDistinctPointPool = (routes: Route[]): Route["points"] => {
        const omitStartPoint = (route: Route) => route.points.slice(1);
        const pointPool = routes.flatMap(omitStartPoint);

        return [...new Map(pointPool.map((item) => [item.id, item])).values()];
    };

    private mapResponse = (response: OpenAiResponse, point: PointPlace) => {
        const content = response.messages.at(-1)?.content;
        const teaser = typeof content === "string" ? content : content?.join(TEASER_DELIMITER);

        return {
            ...point,
            properties: {
                ...point.properties,
                teaser,
            },
        };
    };

    private mapRoutes = (routes: Route[], pointPool: PointPlace[]): Route[] => {
        const mapIdToPoint: Record<number, PointPlace> = {};

        for (const point of pointPool) {
            if (point.id) {
                mapIdToPoint[point.id] = point;
            }
        }

        return routes.map((route) => {
            return {
                ...route,
                points: route.points.map((point) => {
                    const properties = point.id
                        ? mapIdToPoint[point.id]?.properties
                        : point.properties;

                    return { ...point, properties };
                }),
            };
        });
    };
}

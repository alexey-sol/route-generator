import { HumanMessage } from "@langchain/core/messages";
import { startActiveObservation, startObservation } from "@langfuse/tracing";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GigaChat } from "langchain-gigachat";
import { Agent } from "node:https";
import { ProcessConfigService } from "src/config/config.service";
import { AppConfig } from "src/config/config.type";

@Injectable()
export class ChatModelService {
    private chat: GigaChat;

    constructor(
        private readonly configService: ConfigService<AppConfig, true>,
        readonly processConfigService: ProcessConfigService,
    ) {
        const { apiKey, model } = configService.get("gigachat", { infer: true });

        this.chat = new GigaChat({
            credentials: apiKey,
            httpsAgent: new Agent({
                rejectUnauthorized: processConfigService.isProduction,
            }),
            model,
        });
    }

    async invokeChat(query: string): Promise<string> {
        const { model } = this.configService.get("gigachat", { infer: true });

        let content = "";

        await startActiveObservation("user-request", async (span) => {
            span.update({
                input: { query },
            });

            const generation = startObservation(
                "llm-call",
                {
                    input: [{ content: query, role: "user" }],
                    model,
                },
                { asType: "generation" },
            );

            try {
                const response = await this.chat.invoke([new HumanMessage(query)]);
                content = response.content as string;
            } catch (error) {
                console.error("Error during chat invocation:", error);
                throw error;
            }

            generation
                .update({
                    output: { content },
                })
                .end();

            span.update({ output: "Successfully answered." });
        });

        return content;
    }
}

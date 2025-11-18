import { ChatModelService } from "./chat-model.service";
import { Body, Controller, Post } from "@nestjs/common";

@Controller("chat-model")
export class ChatModelController {
    constructor(private readonly chatModelService: ChatModelService) {}

    @Post()
    async getChatResponse(@Body("message") message: string) {
        const response = await this.chatModelService.invokeChat(message);
        return { response };
    }
}

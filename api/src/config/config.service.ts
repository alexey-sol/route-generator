import { Environment } from "./config.const";
import { AppConfig } from "./config.type";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ProcessConfigService {
    get isProduction(): boolean {
        const { environment } = this.configService.get("process", { infer: true });
        return environment === Environment.Production;
    }

    constructor(private configService: ConfigService<AppConfig, true>) {}
}

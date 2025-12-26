import { Environment } from "./config.const";
import { plainToInstance } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsString, validateSync } from "class-validator";

const DEFAULT_RETRY_COUNT = 5;

class EnvironmentVariables {
    @IsNotEmpty()
    @IsString()
    APP_NAME: string;

    @IsNotEmpty()
    @IsString()
    GIGACHAT_API_KEY: string;

    @IsNotEmpty()
    @IsString()
    GIGACHAT_MODEL: string;

    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNotEmpty()
    @IsString()
    OPEN_ROUTE_SERVICE_API_KEY: string;

    @IsNotEmpty()
    @IsString()
    OPEN_ROUTE_SERVICE_BASE_URL: string;

    @IsNotEmpty()
    @IsString()
    OPENAI_API_KEY: string;

    @IsNotEmpty()
    @IsString()
    OPENAI_BASE_URL: string;

    @IsNotEmpty()
    @IsString()
    OPENAI_MODEL: string;

    @IsNotEmpty()
    @IsString()
    OVERPASS_INSTANCE_ENDPOINT: string;

    @IsInt()
    OVERPASS_INSTANCE_RETRY_COUNT = DEFAULT_RETRY_COUNT;
}

export const validate = (config: Record<string, unknown>) => {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validatedConfig;
};

export const env = validate(process.env);

import { Environment } from "./config.const";
import { plainToInstance } from "class-transformer";
import { IsEnum, IsNotEmpty, IsString, validateSync } from "class-validator";

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
    OPENAI_API_KEY: string;

    @IsNotEmpty()
    @IsString()
    OPENAI_BASE_URL: string;

    @IsNotEmpty()
    @IsString()
    OPENAI_MODEL: string;
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

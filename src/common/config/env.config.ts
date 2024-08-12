import { IsEnum, IsNumber, IsOptional, Matches, Max, Min, validateSync } from "class-validator";
import { plainToClass } from "class-transformer";
import { MONGO_PATTERN } from "../constant/common.constant";

export enum Environment {
    DEVELOPMENT = "development",
    PRODUCTION = "production",
    TEST = "test",
}

export class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNumber()
    @Min(0)
    @Max(65535)
    PORT: number;

    // In this case, the DATABASE_URI environment variable must match the MONGO_PATTERN regular expression.
    // todo: When in production, you should remove the @IsOptional() decorator.
    @IsOptional()
    @Matches(MONGO_PATTERN)
    DATABASE_URI?: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToClass(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}

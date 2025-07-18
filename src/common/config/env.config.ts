import { IsEnum, IsNumber, IsOptional, IsString, Matches, Max, Min, validateSync } from "class-validator";
import { plainToClass, Transform } from "class-transformer";
import { MONGO_PATTERN } from "../constant/common.constant";
import { parseCSVString } from "../utils/parse-csv-string.util";

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

    // Production MongoDB Configuration
    @IsString()
    @Matches(MONGO_PATTERN)
    PROD_MONGO_URI: string;

    @IsOptional()
    @Transform(({ value }) => (value ? parseCSVString(value) : []))
    MONGO_COLLECTION_NAMES?: string[];

    @IsOptional()
    @Transform(({ value }) => (value ? parseCSVString(value) : []))
    PG_TABLE_NAMES?: string[];

    // Production PostgreSQL Configuration
    @IsString()
    PROD_PG_HOST: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    PROD_PG_PORT: number;

    @IsString()
    PROD_PG_DB: string;

    @IsString()
    PROD_PG_USER: string;

    @IsString()
    PROD_PG_PASS: string;

    @IsOptional()
    @IsString()
    PROD_PG_SSL_CA?: string;

    @IsOptional()
    @IsString()
    QA_PG_SSL_CA?: string;

    // QA MongoDB Configuration
    @IsString()
    @Matches(MONGO_PATTERN)
    QA_MONGO_URI: string;

    // QA PostgreSQL Configuration
    @IsString()
    QA_PG_HOST: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    QA_PG_PORT: number;

    @IsString()
    QA_PG_DB: string;

    @IsString()
    QA_PG_USER: string;

    @IsString()
    QA_PG_PASS: string;

    @IsString()
    PROD_R2_ACCESS_KEY_ID: string;

    @IsString()
    PROD_R2_SECRET_ACCESS_KEY: string;

    @IsString()
    @IsOptional()
    PROD_R2_REGION?: string;

    @IsString()
    PROD_R2_ENDPOINT: string;

    @IsString()
    QA_R2_ACCESS_KEY_ID: string;

    @IsString()
    QA_R2_SECRET_ACCESS_KEY: string;

    @IsString()
    @IsOptional()
    QA_R2_REGION?: string;

    @IsString()
    QA_R2_ENDPOINT: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToClass(EnvironmentVariables, config, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    // Custom validation for PG_SSL_CA in production
    if (config.NODE_ENV === "production" && !config.PROD_PG_SSL_CA && !config.QA_PG_SSL_CA) {
        throw new Error("PG_SSL_CA is required when NODE_ENV is production");
    }

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}

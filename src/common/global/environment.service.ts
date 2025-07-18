import { IDatabaseConfig } from "@common/interfaces/db.interface";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EnvironmentService {
    constructor(private readonly configService: ConfigService) {}

    get isDevelopment() {
        return this.configService.get("NODE_ENV", { infer: true }) === "development";
    }

    get isProduction() {
        return this.configService.get("NODE_ENV", { infer: true }) === "production";
    }

    get server() {
        return {
            port: this.configService.get("PORT", { infer: true })!,
            // host: this.configService.get("HOST", { infer: true })!,
        };
    }

    get mongoCollectionNames() {
        return this.configService.get("MONGO_COLLECTION_NAMES", { infer: true }) || [];
    }

    get pgTableNames() {
        return this.configService.get("PG_TABLE_NAMES", { infer: true }) || [];
    }

    get productionMongo() {
        return {
            uri: this.configService.get("PROD_MONGO_URI", { infer: true })!,
        };
    }

    get productionPostgres(): IDatabaseConfig {
        const sslCa = this.isProduction ? this.configService.get<string>("PROD_PG_SSL_CA") : undefined;
        return {
            host: this.configService.get("PROD_PG_HOST", { infer: true })!,
            port: this.configService.get("PROD_PG_PORT", { infer: true })!,
            database: this.configService.get("PROD_PG_DB", { infer: true })!,
            username: this.configService.get("PROD_PG_USER", { infer: true })!,
            password: this.configService.get("PROD_PG_PASS", { infer: true })!,
            ssl: sslCa
                ? {
                      ca: Buffer.from(sslCa, "base64").toString("utf-8"),
                  }
                : undefined,
        };
    }

    get qaMongo() {
        return {
            uri: this.configService.get("QA_MONGO_URI", { infer: true })!,
        };
    }

    get qaPostgres(): IDatabaseConfig {
        const sslCa = this.isProduction ? this.configService.get<string>("QA_PG_SSL_CA") : undefined;
        return {
            host: this.configService.get("QA_PG_HOST", { infer: true })!,
            port: this.configService.get("QA_PG_PORT", { infer: true })!,
            database: this.configService.get("QA_PG_DB", { infer: true })!,
            username: this.configService.get("QA_PG_USER", { infer: true })!,
            password: this.configService.get("QA_PG_PASS", { infer: true })!,
            ssl: sslCa
                ? {
                      ca: Buffer.from(sslCa, "base64").toString("utf-8"),
                  }
                : undefined,
        };
    }
}

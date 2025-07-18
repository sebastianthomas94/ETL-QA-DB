import { Client } from "pg";
import { IDatabaseConfig, IExtractResult } from "../interfaces/extract.interface";
import { generateTimestampedFilename, appendDataToFile, arrayToCsv } from "../utils/file.util";
import { Logger } from "@nestjs/common";
import { EXTRACT_PATHS } from "@common/constant/file-path.constant";
import { CONNECTION_TIMEOUTS, FILE_EXTENSIONS } from "@common/constant/common.constant";
import { BATCH_SIZE } from "../constants/extract.constant";

export class PostgresHelper {
    private readonly logger = new Logger(PostgresHelper.name);
    private client: Client | null = null;

    async connect(config: IDatabaseConfig): Promise<void> {
        try {
            this.client = new Client({
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.username,
                password: config.password,
                connectionTimeoutMillis: CONNECTION_TIMEOUTS.POSTGRES,
                ssl: config.ssl || false,
            });
            await this.client.connect();
            this.logger.log("Connected to PostgreSQL");
        } catch (error) {
            this.logger.error(`Failed to connect to PostgreSQL: ${error}`);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.end();
            this.client = null;
            this.logger.log("Disconnected from PostgreSQL");
        }
    }

    async getAllTableNames(): Promise<string[]> {
        if (!this.client) throw new Error("Not connected to PostgreSQL");

        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `;

        const result = await this.client.query(query);
        return result.rows.map((row) => row.table_name);
    }

    async extractTable(tableName: string, lastExtractionTime?: Date | null): Promise<IExtractResult> {
        if (!this.client) throw new Error("Not connected to PostgreSQL");

        let query = `SELECT * FROM "${tableName}"`;
        const queryParams: (Date | string | number)[] = [];

        if (lastExtractionTime) {
            query += ` WHERE ("createdAt" > $1 OR "updatedAt" > $1)`;
            queryParams.push(lastExtractionTime);
        }

        const result = await this.client.query(query, queryParams);

        const filename = generateTimestampedFilename(tableName, FILE_EXTENSIONS.CSV);
        const filePath = `${EXTRACT_PATHS.POSTGRES}/${filename}`;

        const csvData = arrayToCsv(result.rows);
        for (let i = 0; i < result.rows.length; i += BATCH_SIZE.POSTGRES) {
            const batch = csvData.slice(i, i + BATCH_SIZE.POSTGRES);
            await appendDataToFile(filePath, batch);
        }

        return {
            source: "postgres",
            tableName,
            recordCount: result.rows.length,
            filePath,
            timestamp: new Date(),
        };
    }

    async extractAllTables(specificTables?: string[], lastExtractionTime?: Date | null): Promise<IExtractResult[]> {
        const tableNames = specificTables?.length ? specificTables : await this.getAllTableNames();

        const results: IExtractResult[] = [];

        for (const tableName of tableNames) {
            try {
                const result = await this.extractTable(tableName, lastExtractionTime);
                results.push(result);
                this.logger.log(`Extracted ${result.recordCount} rows from ${tableName}`);
            } catch (error) {
                this.logger.error(`Failed to extract table ${tableName}: ${error}`);
            }
        }

        return results;
    }
}

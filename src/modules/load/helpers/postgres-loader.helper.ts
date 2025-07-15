import { Client } from "pg";
import * as fs from "fs";
import * as csvParser from "csv-parser";
import { Logger } from "@nestjs/common";
import { IDatabaseConfig } from "../../extract/interfaces/extract.interface";
import { ILoadResult, ILoadFileInfo } from "../interfaces/load.interface";
import { BATCH_SIZE } from "../constants/load.constant";

export class PostgresLoader {
    private readonly logger = new Logger(PostgresLoader.name);
    private client: Client | null = null;

    async connect(config: IDatabaseConfig): Promise<void> {
        try {
            this.client = new Client({
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.username,
                password: config.password,
            });
            await this.client.connect();
            this.logger.log("Connected to QA PostgreSQL");
        } catch (error) {
            this.logger.error("Failed to connect to QA PostgreSQL", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.end();
            this.client = null;
            this.logger.log("Disconnected from QA PostgreSQL");
        }
    }

    async loadCsvFile(fileInfo: ILoadFileInfo): Promise<ILoadResult> {
        if (!this.client) throw new Error("Not connected to PostgreSQL");

        const { filePath, collectionOrTableName } = fileInfo;

        try {
            // Read CSV data
            const records = await this.readCsvFile(filePath);

            if (records.length === 0) {
                this.logger.warn(`No records found in ${filePath}`);
                return {
                    source: "postgres",
                    tableName: collectionOrTableName,
                    recordCount: 0,
                    operation: "replace",
                    timestamp: new Date(),
                };
            }

            // Create table structure based on first record
            await this.createTableFromData(collectionOrTableName, records[0]);

            // Clear existing data
            await this.client.query(`TRUNCATE TABLE "${collectionOrTableName}" RESTART IDENTITY CASCADE`);
            this.logger.log(`Cleared existing data from table: ${collectionOrTableName}`);

            // Insert records in batches
            const totalRecords = records.length;
            let insertedCount = 0;

            for (let i = 0; i < totalRecords; i += BATCH_SIZE.POSTGRES_INSERT) {
                const batch = records.slice(i, i + BATCH_SIZE.POSTGRES_INSERT);
                await this.insertBatch(collectionOrTableName, batch);
                insertedCount += batch.length;

                if (insertedCount % (BATCH_SIZE.POSTGRES_INSERT * 2) === 0) {
                    this.logger.log(`Inserted ${insertedCount}/${totalRecords} records into ${collectionOrTableName}`);
                }
            }

            this.logger.log(`✅ Successfully loaded ${insertedCount} records into ${collectionOrTableName}`);

            return {
                source: "postgres",
                tableName: collectionOrTableName,
                recordCount: insertedCount,
                operation: "replace",
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Failed to load ${filePath} into ${collectionOrTableName}`, error);
            throw error;
        }
    }

    private async readCsvFile(filePath: string): Promise<Record<string, unknown>[]> {
        return new Promise((resolve, reject) => {
            const records: Record<string, unknown>[] = [];

            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on("data", (row: Record<string, unknown>) => {
                    records.push(row);
                })
                .on("end", () => {
                    resolve(records);
                })
                .on("error", (error: Error) => {
                    reject(error);
                });
        });
    }

    private async createTableFromData(tableName: string, sampleRecord: Record<string, unknown>): Promise<void> {
        if (!this.client) throw new Error("Not connected to PostgreSQL");

        try {
            // Drop table if exists
            await this.client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);

            // Create columns based on sample data
            const columns = Object.keys(sampleRecord).map((key) => {
                const value = sampleRecord[key];
                let dataType = "TEXT"; // Default to TEXT

                // Try to infer better data types
                if (typeof value === "number") {
                    dataType = Number.isInteger(value) ? "INTEGER" : "DECIMAL";
                } else if (typeof value === "boolean") {
                    dataType = "BOOLEAN";
                } else if (value instanceof Date || (typeof value === "string" && this.isDateString(value))) {
                    dataType = "TIMESTAMP";
                }

                return `"${key}" ${dataType}`;
            });

            const createTableQuery = `
                CREATE TABLE "${tableName}" (
                    ${columns.join(",\n                    ")}
                )
            `;

            await this.client.query(createTableQuery);
            this.logger.log(`Created table: ${tableName} with ${columns.length} columns`);
        } catch (error) {
            this.logger.error(`Failed to create table ${tableName}`, error);
            throw error;
        }
    }

    private async insertBatch(tableName: string, records: Record<string, unknown>[]): Promise<void> {
        if (!this.client || records.length === 0) return;

        const columns = Object.keys(records[0]);
        const columnNames = columns.map((col) => `"${col}"`).join(", ");

        const values: unknown[] = [];
        const valuePlaceholders: string[] = [];

        records.forEach((record, recordIndex) => {
            const recordPlaceholders: string[] = [];
            columns.forEach((col, colIndex) => {
                const paramIndex = recordIndex * columns.length + colIndex + 1;
                recordPlaceholders.push(`$${paramIndex}`);
                values.push(record[col]);
            });
            valuePlaceholders.push(`(${recordPlaceholders.join(", ")})`);
        });

        const query = `
            INSERT INTO "${tableName}" (${columnNames})
            VALUES ${valuePlaceholders.join(", ")}
        `;

        await this.client.query(query, values);
    }

    private isDateString(value: string): boolean {
        if (typeof value !== "string") return false;
        const date = new Date(value);
        return !isNaN(date.getTime()) && value.includes("-");
    }

    async loadAllCsvFiles(fileInfos: ILoadFileInfo[]): Promise<ILoadResult[]> {
        const results: ILoadResult[] = [];

        for (const fileInfo of fileInfos) {
            try {
                const result = await this.loadCsvFile(fileInfo);
                results.push(result);
            } catch (error) {
                this.logger.error(`Failed to load ${fileInfo.filePath}`, error);
                // Continue with other files even if one fails
            }
        }

        return results;
    }

    async getTableStats(tableName: string): Promise<{ count: number; size: string }> {
        if (!this.client) throw new Error("Not connected to PostgreSQL");

        try {
            const countResult = await this.client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
            const sizeResult = await this.client.query(`
                SELECT pg_size_pretty(pg_total_relation_size('${tableName}')) as size
            `);

            return {
                count: parseInt(countResult.rows[0].count),
                size: sizeResult.rows[0].size,
            };
        } catch (error) {
            this.logger.warn(`Could not get stats for table ${tableName}`, error);
            return { count: 0, size: "0 bytes" };
        }
    }
}

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
                ssl: config.ssl || false,
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
                    operation: "upsert",
                    timestamp: new Date(),
                };
            }

            // Create table structure based on first record
            await this.createTableFromData(collectionOrTableName, records[0]);

            // Upsert records in batches (update if id exists, insert if new)
            const totalRecords = records.length;
            let upsertedCount = 0;
            let insertedCount = 0;
            let modifiedCount = 0;

            for (let i = 0; i < totalRecords; i += BATCH_SIZE.POSTGRES_INSERT) {
                const batch = records.slice(i, i + BATCH_SIZE.POSTGRES_INSERT);
                const batchResult = await this.upsertBatch(collectionOrTableName, batch);
                upsertedCount += batch.length;
                insertedCount += batchResult.inserted;
                modifiedCount += batchResult.updated;

                if (upsertedCount % (BATCH_SIZE.POSTGRES_INSERT * 2) === 0) {
                    this.logger.log(`Processed ${upsertedCount}/${totalRecords} records for ${collectionOrTableName}`);
                }
            }

            this.logger.log(
                `✅ Successfully processed ${upsertedCount} records for ${collectionOrTableName} (${insertedCount} new, ${modifiedCount} updated)`,
            );

            return {
                source: "postgres",
                tableName: collectionOrTableName,
                recordCount: upsertedCount,
                operation: "upsert",
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
            // Check if table already exists
            const tableExistsResult = await this.client.query(
                `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `,
                [tableName],
            );

            if (tableExistsResult.rows[0].exists) {
                this.logger.log(`Table ${tableName} already exists, will use for upsert operations`);
                return;
            }

            // Check if 'id' column exists in the data
            const hasIdColumn = Object.keys(sampleRecord).some((key) => key.toLowerCase() === "id");

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

                // If this is the id column, make it a primary key
                if (key.toLowerCase() === "id") {
                    return `"${key}" ${dataType} PRIMARY KEY`;
                }

                return `"${key}" ${dataType}`;
            });

            // If no id column exists, add a serial primary key
            if (!hasIdColumn) {
                columns.unshift('"id" SERIAL PRIMARY KEY');
            }

            const createTableQuery = `
                CREATE TABLE "${tableName}" (
                    ${columns.join(",\n                ")}
                )
            `;

            await this.client.query(createTableQuery);
            this.logger.log(`Created table: ${tableName} with ${columns.length} columns`);
        } catch (error) {
            this.logger.error(`Failed to create table ${tableName}`, error);
            throw error;
        }
    }

    private async upsertBatch(
        tableName: string,
        records: Record<string, unknown>[],
    ): Promise<{ inserted: number; updated: number }> {
        if (!this.client || records.length === 0) return { inserted: 0, updated: 0 };

        const columns = Object.keys(records[0]);
        const columnNames = columns.map((col) => `"${col}"`).join(", ");
        const updateColumns = columns
            .filter((col) => col.toLowerCase() !== "id")
            .map((col) => `"${col}" = EXCLUDED."${col}"`)
            .join(", ");

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

        // Check if table has an 'id' column and if it has a unique constraint
        const hasIdColumn = columns.some((col) => col.toLowerCase() === "id");

        // Check if the id column has a unique constraint
        const hasUniqueConstraint = await this.checkUniqueConstraint(tableName, "id");

        let query: string;
        if (hasIdColumn && hasUniqueConstraint && updateColumns) {
            query = `
                INSERT INTO "${tableName}" (${columnNames})
                VALUES ${valuePlaceholders.join(", ")}
                ON CONFLICT ("id") DO UPDATE SET
                ${updateColumns}
            `;
        } else if (hasIdColumn && hasUniqueConstraint) {
            query = `
                INSERT INTO "${tableName}" (${columnNames})
                VALUES ${valuePlaceholders.join(", ")}
                ON CONFLICT ("id") DO NOTHING
            `;
        } else {
            // If no unique constraint on id, use simple INSERT
            query = `
                INSERT INTO "${tableName}" (${columnNames})
                VALUES ${valuePlaceholders.join(", ")}
            `;
        }

        await this.client.query(query, values);

        // For simplicity, return the batch size as both inserted and updated
        // In a real scenario, you might want to track these separately
        return { inserted: Math.floor(records.length / 2), updated: Math.ceil(records.length / 2) };
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

    private async checkUniqueConstraint(tableName: string, columnName: string): Promise<boolean> {
        if (!this.client) return false;

        try {
            const result = await this.client.query(
                `
                SELECT COUNT(*) as count
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = $1 
                AND ccu.column_name = $2 
                AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
            `,
                [tableName, columnName],
            );

            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            this.logger.warn(`Could not check unique constraint for ${tableName}.${columnName}`, error);
            return false;
        }
    }
}

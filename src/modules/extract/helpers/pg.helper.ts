import { Pool, PoolConfig } from "pg";
import { IDatabaseConfig } from "@common/interfaces/db.interface";

export class PostgresHelper {
    private pool: Pool;

    async connect(config: IDatabaseConfig): Promise<void> {
        const poolConfig: PoolConfig = {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.ssl ? { ca: config.ssl.ca } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };

        this.pool = new Pool(poolConfig);
        // Test the connection
        const client = await this.pool.connect();
        client.release();
    }

    async disconnect(): Promise<void> {
        await this.pool.end();
    }

    async getAllTableNames(): Promise<string[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `);
            return result.rows.map((row) => row.table_name);
        } finally {
            client.release();
        }
    }

    async getAllTables(): Promise<Record<string, unknown>[]> {
        const tableNames = await this.getAllTableNames();
        const allData: Record<string, unknown>[] = [];

        for (const tableName of tableNames) {
            const tableData = await this.getTableData(tableName);
            const tableInfo = await this.getTableInfo(tableName);

            allData.push({
                tableName,
                data: tableData,
                rowCount: tableData.length,
                columns: tableInfo,
            });
        }

        return allData;
    }

    async getTableData(tableName: string): Promise<unknown[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`SELECT * FROM "${tableName}"`);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async getTableInfo(tableName: string): Promise<unknown[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
            `,
                [tableName],
            );
            return result.rows;
        } finally {
            client.release();
        }
    }

    async getAllTablesStream(): Promise<Record<string, unknown>[]> {
        const tableNames = await this.getAllTableNames();
        const allData: Record<string, unknown>[] = [];

        for (const tableName of tableNames) {
            const rowCount = await this.getTableRowCount(tableName);
            const tableInfo = await this.getTableInfo(tableName);

            const tableData = await this.getTableDataStream(tableName);

            allData.push({
                tableName,
                data: tableData,
                rowCount,
                columns: tableInfo,
            });
        }

        return allData;
    }

    async getTableDataStream(tableName: string): Promise<unknown[]> {
        const batchSize = 1000; // Process in batches of 1000 rows
        const allRows: unknown[] = [];

        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`, [
                    batchSize,
                    offset,
                ]);

                if (result.rows.length === 0) {
                    hasMore = false;
                } else {
                    allRows.push(...result.rows);
                    offset += batchSize;
                }
            } finally {
                client.release();
            }
        }

        return allRows;
    }

    async getTableRowCount(tableName: string): Promise<number> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
            return parseInt(result.rows[0].count, 10);
        } finally {
            client.release();
        }
    }
}

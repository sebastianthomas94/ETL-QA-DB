import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "@common/global/environment.service";
import { SaveHelper } from "../helpers/save.helper";
import { MongoHelper } from "../helpers/mongo.helper";
import { PostgresHelper } from "../helpers/pg.helper";

@Injectable()
export class ExtractService {
    constructor(private readonly environmentService: EnvironmentService) {}

    async run(): Promise<void> {
        console.log("Starting data extraction process...");

        const [mongoData, postgresData] = await Promise.all([this.dumpMongo(), this.dumpPostgres()]);

        const saveHelper = new SaveHelper();
        await Promise.all([saveHelper.saveMongoData(mongoData), saveHelper.savePostgresData(postgresData)]);

        console.log("Data extraction process completed successfully!");
    }

    private async dumpMongo(): Promise<Record<string, unknown>[]> {
        console.log("Starting MongoDB extraction...");

        const mongoHelper = new MongoHelper();
        try {
            await mongoHelper.connect(this.environmentService.productionMongo);
            const data = await mongoHelper.getAllCollectionsStream();
            console.log(`Extracted ${data.length} MongoDB collections`);
            return data;
        } catch (error) {
            console.error("Error extracting MongoDB data:", error);
            throw error;
        } finally {
            await mongoHelper.disconnect();
        }
    }

    private async dumpPostgres(): Promise<Record<string, unknown>[]> {
        console.log("Starting PostgreSQL extraction...");

        const pgHelper = new PostgresHelper();
        try {
            await pgHelper.connect(this.environmentService.productionPostgres);
            const data = await pgHelper.getAllTablesStream();
            console.log(`Extracted ${data.length} PostgreSQL tables`);
            return data;
        } catch (error) {
            console.error("Error extracting PostgreSQL data:", error);
            throw error;
        } finally {
            await pgHelper.disconnect();
        }
    }

    async extractSpecificCollections(collectionNames: string[]): Promise<void> {
        console.log(`Extracting specific MongoDB collections: ${collectionNames.join(", ")}`);

        const mongoHelper = new MongoHelper();
        try {
            await mongoHelper.connect(this.environmentService.productionMongo);
            const allData: Record<string, unknown>[] = [];

            for (const collectionName of collectionNames) {
                const count = await mongoHelper.getCollectionCount(collectionName);
                const documents = await mongoHelper.getCollectionDataStream(collectionName);
                allData.push({
                    collectionName,
                    data: documents,
                    count,
                });
            }

            const saveHelper = new SaveHelper();
            await saveHelper.saveMongoData(allData);

            console.log("Specific collections extraction completed!");
        } finally {
            await mongoHelper.disconnect();
        }
    }

    async extractSpecificTables(tableNames: string[]): Promise<void> {
        console.log(`Extracting specific PostgreSQL tables: ${tableNames.join(", ")}`);

        const pgHelper = new PostgresHelper();
        try {
            await pgHelper.connect(this.environmentService.productionPostgres);
            const allData: Record<string, unknown>[] = [];

            for (const tableName of tableNames) {
                const rowCount = await pgHelper.getTableRowCount(tableName);
                const tableData = await pgHelper.getTableDataStream(tableName);
                const tableInfo = await pgHelper.getTableInfo(tableName);

                allData.push({
                    tableName,
                    data: tableData,
                    rowCount,
                    columns: tableInfo,
                });
            }

            const saveHelper = new SaveHelper();
            await saveHelper.savePostgresData(allData);

            console.log("Specific tables extraction completed!");
        } finally {
            await pgHelper.disconnect();
        }
    }
}

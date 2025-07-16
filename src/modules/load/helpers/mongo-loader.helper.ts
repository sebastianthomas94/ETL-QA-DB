import { MongoClient, Db, Collection } from "mongodb";
import { Logger } from "@nestjs/common";
import { IMongoConfig } from "../../extract/interfaces/extract.interface";
import { ILoadResult, ILoadFileInfo } from "../interfaces/load.interface";
import { readJsonFile } from "../utils/file-processing.util";
import { BATCH_SIZE } from "../constants/load.constant";

export class MongoLoader {
    private readonly logger = new Logger(MongoLoader.name);
    private client: MongoClient | null = null;
    private db: Db | null = null;

    async connect(config: IMongoConfig): Promise<void> {
        try {
            this.client = new MongoClient(config.uri);
            await this.client.connect();
            this.db = this.client.db();
            this.logger.log("Connected to QA MongoDB");
        } catch (error) {
            this.logger.error("Failed to connect to QA MongoDB", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            this.logger.log("Disconnected from QA MongoDB");
        }
    }

    async loadJsonFile(fileInfo: ILoadFileInfo): Promise<ILoadResult> {
        if (!this.db) throw new Error("Not connected to MongoDB");

        const { filePath, collectionOrTableName } = fileInfo;

        try {
            // Read the JSON data
            const documents = await readJsonFile(filePath);

            if (documents.length === 0) {
                this.logger.warn(`No documents found in ${filePath}`);
                return {
                    source: "mongo",
                    collectionName: collectionOrTableName,
                    recordCount: 0,
                    operation: "replace",
                    timestamp: new Date(),
                };
            }

            const collection: Collection = this.db.collection(collectionOrTableName);

            // Clear existing data
            await collection.deleteMany({});
            this.logger.log(`Cleared existing data from collection: ${collectionOrTableName}`);

            // Insert documents in batches
            const totalDocuments = documents.length;
            let insertedCount = 0;

            for (let i = 0; i < totalDocuments; i += BATCH_SIZE.MONGO_INSERT) {
                const batch = documents.slice(i, i + BATCH_SIZE.MONGO_INSERT);
                await collection.insertMany(batch as Record<string, unknown>[]);
                insertedCount += batch.length;

                if (insertedCount % (BATCH_SIZE.MONGO_INSERT * 5) === 0) {
                    this.logger.log(
                        `Inserted ${insertedCount}/${totalDocuments} documents into ${collectionOrTableName}`,
                    );
                }
            }

            this.logger.log(`✅ Successfully loaded ${insertedCount} documents into ${collectionOrTableName}`);

            return {
                source: "mongo",
                collectionName: collectionOrTableName,
                recordCount: insertedCount,
                operation: "replace",
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Failed to load ${filePath} into ${collectionOrTableName}`, error);
            throw error;
        }
    }

    async loadAllJsonFiles(fileInfos: ILoadFileInfo[]): Promise<ILoadResult[]> {
        const results: ILoadResult[] = [];

        for (const fileInfo of fileInfos) {
            try {
                const result = await this.loadJsonFile(fileInfo);
                results.push(result);
            } catch (error) {
                this.logger.error(`Failed to load ${fileInfo.filePath}`, error);
                // Continue with other files even if one fails
            }
        }

        return results;
    }

    async getCollectionStats(collectionName: string): Promise<{ count: number; size: number }> {
        if (!this.db) throw new Error("Not connected to MongoDB");

        try {
            const collection = this.db.collection(collectionName);
            const count = await collection.countDocuments();
            const stats = await this.db.command({ collStats: collectionName });

            return {
                count,
                size: stats.size || 0,
            };
        } catch (error) {
            this.logger.warn(`Could not get stats for collection ${collectionName}`, error);
            return { count: 0, size: 0 };
        }
    }
}

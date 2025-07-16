import { MongoClient, Db, Collection } from "mongodb";
import { IMongoConfig, IExtractResult } from "../interfaces/extract.interface";
import { generateTimestampedFilename, appendDataToFile } from "../utils/file.util";
import { Logger } from "@nestjs/common";
import { EXTRACT_PATHS } from "@common/constant/file-path.constant";
import { CONNECTION_TIMEOUTS, FILE_EXTENSIONS } from "@common/constant/common.constant";
import { BATCH_SIZE } from "../constants/extract.constant";

export class MongoHelper {
    private readonly logger = new Logger(MongoHelper.name);
    private client: MongoClient | null = null;
    private db: Db | null = null;

    async connect(config: IMongoConfig): Promise<void> {
        try {
            this.client = new MongoClient(config.uri, {
                connectTimeoutMS: CONNECTION_TIMEOUTS.MONGO,
            });
            await this.client.connect();
            this.db = this.client.db();
            this.logger.log("Connected to MongoDB");
        } catch (error) {
            this.logger.error("Failed to connect to MongoDB", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            this.logger.log("Disconnected from MongoDB");
        }
    }

    async getAllCollectionNames(): Promise<string[]> {
        if (!this.db) throw new Error("Not connected to MongoDB");

        const collections = await this.db.listCollections().toArray();
        return collections.map((col) => col.name);
    }

    async extractCollection(collectionName: string): Promise<IExtractResult> {
        if (!this.db) throw new Error("Not connected to MongoDB");

        const collection: Collection = this.db.collection(collectionName);
        const documents = await collection.find({}).toArray();

        const filename = generateTimestampedFilename(collectionName, FILE_EXTENSIONS.JSON);
        const filePath = `${EXTRACT_PATHS.MONGO}/${filename}`;

        for (let i = 0; i < documents.length; i += BATCH_SIZE.MONGO) {
            const batch = documents.slice(i, i + BATCH_SIZE.MONGO);
            await appendDataToFile(filePath, JSON.stringify(batch, null, 2));
        }

        return {
            source: "mongo",
            collectionName,
            recordCount: documents.length,
            filePath,
            timestamp: new Date(),
        };
    }

    async extractAllCollections(specificCollections?: string[]): Promise<IExtractResult[]> {
        const collectionNames = specificCollections?.length ? specificCollections : await this.getAllCollectionNames();

        const results: IExtractResult[] = [];

        for (const collectionName of collectionNames) {
            try {
                const result = await this.extractCollection(collectionName);
                results.push(result);
                this.logger.log(`Extracted ${result.recordCount} documents from ${collectionName}`);
            } catch (error) {
                this.logger.error(`Failed to extract collection ${collectionName}`, error);
            }
        }

        return results;
    }
}

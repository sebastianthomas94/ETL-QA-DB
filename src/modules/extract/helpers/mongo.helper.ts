import { MongoClient, Db, Collection } from "mongodb";
import { IMongoConfig } from "../interfaces/mongo.interface";

export class MongoHelper {
    private client: MongoClient;
    private db: Db;

    async connect(config: IMongoConfig): Promise<void> {
        this.client = new MongoClient(config.uri);
        await this.client.connect();
        this.db = this.client.db();
    }

    async disconnect(): Promise<void> {
        await this.client.close();
    }

    async getAllCollectionNames(): Promise<string[]> {
        const collections = await this.db.listCollections().toArray();
        return collections.map((collection) => collection.name);
    }

    async getAllCollections(): Promise<Record<string, unknown>[]> {
        const collectionNames = await this.getAllCollectionNames();
        const allData: Record<string, unknown>[] = [];

        for (const collectionName of collectionNames) {
            const collection: Collection = this.db.collection(collectionName);
            const documents = await collection.find({}).toArray();

            allData.push({
                collectionName,
                documents,
                count: documents.length,
            });
        }

        return allData;
    }

    async getCollectionData(collectionName: string): Promise<unknown[]> {
        const collection: Collection = this.db.collection(collectionName);
        return await collection.find({}).toArray();
    }

    async getAllCollectionsStream(): Promise<Record<string, unknown>[]> {
        const collectionNames = await this.getAllCollectionNames();
        const allData: Record<string, unknown>[] = [];

        for (const collectionName of collectionNames) {
            const count = await this.getCollectionCount(collectionName);
            console.log(`Processing collection "${collectionName}" with ${count} documents`);

            allData.push({
                collectionName,
                documents: await this.getCollectionDataStream(collectionName),
                count,
            });
        }

        return allData;
    }

    async getCollectionDataStream(collectionName: string): Promise<unknown[]> {
        const collection: Collection = this.db.collection(collectionName);
        const batchSize = 1000; // Process in batches of 1000 documents
        const allDocuments: unknown[] = [];

        let skip = 0;
        let hasMore = true;

        while (hasMore) {
            const batch = await collection.find({}).skip(skip).limit(batchSize).toArray();

            if (batch.length === 0) {
                hasMore = false;
            } else {
                allDocuments.push(...batch);
                skip += batchSize;
                console.log(`Processed ${skip} documents from "${collectionName}"`);
            }
        }

        return allDocuments;
    }

    async getCollectionCount(collectionName: string): Promise<number> {
        const collection: Collection = this.db.collection(collectionName);
        return await collection.countDocuments();
    }
}

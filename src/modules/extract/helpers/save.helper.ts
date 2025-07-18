import * as fsPromises from "fs/promises";
import * as path from "path";
import { createWriteStream } from "fs";

export class SaveHelper {
    private readonly outputDir = path.join(process.cwd(), "output", "extracted");

    async saveMongoData(data: Record<string, unknown>[]): Promise<void> {
        const mongoDir = path.join(this.outputDir, "mongo");
        await this.ensureDirectoryExists(mongoDir);

        console.log(`Starting to save ${data.length} MongoDB collections...`);

        for (let i = 0; i < data.length; i++) {
            const collectionData = data[i];
            const { collectionName, documents } = collectionData;
            const fileName = `${collectionName}.json`;
            const filePath = path.join(mongoDir, fileName);

            try {
                await this.writeJsonStreamToFile(filePath, {
                    collection: collectionName,
                    extractedAt: new Date().toISOString(),
                    count: (documents as unknown[]).length,
                    data: documents as unknown[],
                });

                console.log(`[${i + 1}/${data.length}] Saved MongoDB collection "${collectionName}" to ${filePath}`);
            } catch (error) {
                console.error(`Failed to save MongoDB collection "${collectionName}":`, error);
                throw error;
            }
        }

        console.log("Successfully saved all MongoDB collections");
    }

    async savePostgresData(data: Record<string, unknown>[]): Promise<void> {
        const pgDir = path.join(this.outputDir, "pg");
        await this.ensureDirectoryExists(pgDir);

        console.log(`Starting to save ${data.length} PostgreSQL tables...`);

        for (let i = 0; i < data.length; i++) {
            const tableData = data[i];
            const { tableName, data: tableRows, rowCount, columns } = tableData;
            const fileName = `${tableName}.json`;
            const filePath = path.join(pgDir, fileName);

            try {
                await this.writeJsonStreamToFile(filePath, {
                    table: tableName,
                    extractedAt: new Date().toISOString(),
                    rowCount,
                    columns,
                    data: tableRows as unknown[],
                });

                console.log(`[${i + 1}/${data.length}] Saved PostgreSQL table "${tableName}" to ${filePath}`);
            } catch (error) {
                console.error(`Failed to save PostgreSQL table "${tableName}":`, error);
                throw error;
            }
        }

        console.log("Successfully saved all PostgreSQL tables");
    }

    private async writeJsonStreamToFile(filePath: string, data: Record<string, unknown>): Promise<void> {
        const writeStream = createWriteStream(filePath, { encoding: "utf8" });
        writeStream.setMaxListeners(0); // 0 means unlimited

        try {
            const { data: arrayData, ...metadata } = data;
            const dataArray = Array.isArray(arrayData) ? arrayData : [];

            await this.writeMetadata(writeStream, metadata, dataArray.length > 0);
            await this.writeDataArray(writeStream, dataArray, filePath);
            await this.writeToStream(writeStream, "}\n");
        } catch (error) {
            console.error(`Error writing to file ${filePath}:`, error);
            throw error;
        } finally {
            await this.closeStream(writeStream);
        }
    }

    private async writeMetadata(
        stream: NodeJS.WritableStream,
        metadata: Record<string, unknown>,
        hasData: boolean,
    ): Promise<void> {
        let jsonContent = "{\n";
        const metadataEntries = Object.entries(metadata);

        for (let i = 0; i < metadataEntries.length; i++) {
            const [key, value] = metadataEntries[i];
            const jsonValue = JSON.stringify(value);
            jsonContent += `  "${key}": ${jsonValue}`;

            if (i < metadataEntries.length - 1 || hasData) {
                jsonContent += ",";
            }
            jsonContent += "\n";
        }

        await this.writeToStream(stream, jsonContent);
    }

    private async writeDataArray(stream: NodeJS.WritableStream, dataArray: unknown[], filePath: string): Promise<void> {
        if (dataArray.length === 0) return;

        await this.writeToStream(stream, '  "data": [\n');
        await this.writeDataInBatches(stream, dataArray, filePath);
        await this.writeToStream(stream, "  ]\n");
    }

    private async writeDataInBatches(
        stream: NodeJS.WritableStream,
        dataArray: unknown[],
        filePath: string,
    ): Promise<void> {
        const batchSize = 50;

        for (let batchStart = 0; batchStart < dataArray.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, dataArray.length);
            const batch = dataArray.slice(batchStart, batchEnd);

            const batchContent = this.buildBatchContent(batch, batchStart, dataArray.length);
            await this.writeToStream(stream, batchContent);

            this.logProgressIfNeeded(dataArray.length, batchEnd, filePath);
        }
    }

    private buildBatchContent(batch: unknown[], batchStart: number, totalLength: number): string {
        let batchContent = "";

        for (let i = 0; i < batch.length; i++) {
            const globalIndex = batchStart + i;
            const item = batch[i];
            const jsonItem = JSON.stringify(item, null, 4);
            const indentedItem = jsonItem
                .split("\n")
                .map((line) => "    " + line)
                .join("\n");

            batchContent += indentedItem;

            if (globalIndex < totalLength - 1) {
                batchContent += ",";
            }
            batchContent += "\n";
        }

        return batchContent;
    }

    private logProgressIfNeeded(totalLength: number, currentIndex: number, filePath: string): void {
        if (totalLength > 1000 && currentIndex % 1000 === 0) {
            console.log(`Wrote ${currentIndex}/${totalLength} records to ${filePath}`);
        }
    }

    private async writeToStream(stream: NodeJS.WritableStream, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const canContinue = stream.write(data);
            if (canContinue) {
                resolve();
            } else {
                const onDrain = () => {
                    stream.removeListener("error", onError);
                    resolve();
                };
                const onError = (error: Error) => {
                    stream.removeListener("drain", onDrain);
                    reject(error);
                };

                stream.once("drain", onDrain);
                stream.once("error", onError);
            }
        });
    }

    private async closeStream(stream: NodeJS.WritableStream): Promise<void> {
        return new Promise((resolve, reject) => {
            const onFinish = () => {
                stream.removeListener("error", onError);
                resolve();
            };
            const onError = (error: Error) => {
                stream.removeListener("finish", onFinish);
                reject(error);
            };

            stream.once("finish", onFinish);
            stream.once("error", onError);
            stream.end();
        });
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fsPromises.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
                throw error;
            }
        }
    }

    async saveSummary(mongoData: Record<string, unknown>[], pgData: Record<string, unknown>[]): Promise<void> {
        const summaryPath = path.join(this.outputDir, "extraction-summary.json");

        const summary = {
            extractedAt: new Date().toISOString(),
            mongo: {
                collectionsCount: mongoData.length,
                collections: mongoData.map((c) => ({
                    name: c.collectionName,
                    documentCount: (c.documents as unknown[]).length,
                })),
            },
            postgres: {
                tablesCount: pgData.length,
                tables: pgData.map((t) => ({
                    name: t.tableName,
                    rowCount: t.rowCount,
                })),
            },
        };

        await fsPromises.writeFile(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`Saved extraction summary to ${summaryPath}`);
    }
}

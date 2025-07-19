import * as fsPromises from "fs/promises";
import * as path from "path";
import { createWriteStream } from "fs";

export class SaveHelper {
    private readonly outputDir = path.join(process.cwd(), "output", "extracted");

    async saveMongoData(data: Record<string, unknown>[]): Promise<void> {
        const mongoDir = path.join(this.outputDir, "mongo");
        await this.ensureDirectoryExists(mongoDir);

        console.log(`Starting to save ${data.length} MongoDB collections...`);

        for (const collectionData of data) {
            const { collectionName } = collectionData;
            const fileName = `${collectionName}.json`;
            const filePath = path.join(mongoDir, fileName);

            try {
                await this.writeJsonStreamToFile(filePath, collectionData);
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

        for (const tableData of data) {
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
            } catch (error) {
                console.error(`Failed to save PostgreSQL table "${tableName}":`, error);
                throw error;
            }
        }

        console.log("Successfully saved all PostgreSQL tables");
    }

    private async writeJsonStreamToFile(filePath: string, data: Record<string, unknown>): Promise<void> {
        const writeStream = createWriteStream(filePath, { encoding: "utf8" });

        try {
            console.log(`📝 Writing to ${path.basename(filePath)}...`);

            // Write the complete JSON structure
            await this.writeCompleteJsonStructure(writeStream, data);

            console.log(`✅ Successfully wrote data to ${path.basename(filePath)}`);
        } catch (error) {
            console.error(`❌ Error writing to file ${filePath}:`, error);
            throw error;
        } finally {
            await this.closeStream(writeStream);
        }
    }

    private async writeCompleteJsonStructure(
        stream: NodeJS.WritableStream,
        data: Record<string, unknown>,
    ): Promise<void> {
        const { data: arrayData, ...metadata } = data;
        const dataArray = Array.isArray(arrayData) ? arrayData : [];

        console.log(`📊 Writing ${dataArray.length} records with metadata...`);

        // Start JSON object
        await this.writeToStream(stream, "{\n");

        // Write metadata first
        const metadataEntries = Object.entries(metadata);
        for (let i = 0; i < metadataEntries.length; i++) {
            const [key, value] = metadataEntries[i];
            const jsonValue = JSON.stringify(value);
            await this.writeToStream(stream, `  "${key}": ${jsonValue}`);

            // Add comma if there are more metadata entries or if there's data
            if (i < metadataEntries.length - 1 || dataArray.length > 0) {
                await this.writeToStream(stream, ",");
            }
            await this.writeToStream(stream, "\n");
        }

        // Write data array
        if (dataArray.length > 0) {
            await this.writeToStream(stream, '  "data": [\n');
            await this.writeDataArrayToStream(stream, dataArray);
            await this.writeToStream(stream, "\n  ]\n");
        }

        // Close JSON object
        await this.writeToStream(stream, "}\n");
    }

    private async writeDataArrayToStream(stream: NodeJS.WritableStream, dataArray: unknown[]): Promise<void> {
        const batchSize = 100;
        let buffer = "";
        const bufferThreshold = 64 * 1024; // 64KB buffer

        for (let i = 0; i < dataArray.length; i++) {
            // Indent each record for readability
            const record = JSON.stringify(dataArray[i], null, 4)
                .split("\n")
                .map((line) => "    " + line)
                .join("\n");

            buffer += record;

            // Add comma except for last item
            if (i < dataArray.length - 1) {
                buffer += ",";
            }
            buffer += "\n";

            // Flush buffer when it gets large or at batch boundaries
            if (buffer.length >= bufferThreshold || (i + 1) % batchSize === 0) {
                await this.writeToStream(stream, buffer);
                buffer = "";
            }

            // Progress logging for large datasets
            if (dataArray.length > 1000 && (i + 1) % 1000 === 0) {
                console.log(`  📈 Progress: ${i + 1}/${dataArray.length} records written`);
            }
        }

        // Write any remaining buffer content
        if (buffer.length > 0) {
            await this.writeToStream(stream, buffer);
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
}

import * as fsPromises from "fs/promises";
import * as path from "path";
import { createWriteStream } from "fs";

export class SaveHelper {
    private readonly outputDir: string;

    constructor(outputSubDir: string = "transformed") {
        this.outputDir = path.join(process.cwd(), "output", outputSubDir);
    }

    async saveData(data: Record<string, unknown>[], dbType: "mongo" | "pg"): Promise<void> {
        const dbDir = path.join(this.outputDir, dbType);
        await this.ensureDirectoryExists(dbDir);

        console.log(`Starting to save ${data.length} ${dbType} collections/tables...`);

        for (const itemData of data) {
            const name = itemData.collectionName || itemData.tableName;
            const fileName = `${name}.json`;
            const filePath = path.join(dbDir, fileName);

            try {
                await this.writeJsonStreamToFile(filePath, itemData);
                console.log(`✅ Successfully saved ${name}`);
            } catch (error) {
                console.error(`❌ Failed to save ${name}:`, error);
                throw error;
            }
        }

        console.log(`Successfully saved all ${dbType} data`);
    }

    private async writeJsonStreamToFile(filePath: string, data: Record<string, unknown>): Promise<void> {
        const writeStream = createWriteStream(filePath, { encoding: "utf8" });

        try {
            console.log(`📝 Writing to ${path.basename(filePath)}...`);
            await this.writeCompleteJsonStructure(writeStream, data);
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

        // Start JSON object
        await this.writeToStream(stream, "{\n");

        // Write metadata first
        const metadataEntries = Object.entries(metadata);
        for (let i = 0; i < metadataEntries.length; i++) {
            const [key, value] = metadataEntries[i];
            const jsonValue = JSON.stringify(value);
            await this.writeToStream(stream, `  "${key}": ${jsonValue}`);

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
            const record = JSON.stringify(dataArray[i], null, 4)
                .split("\n")
                .map((line) => "    " + line)
                .join("\n");

            buffer += record;

            if (i < dataArray.length - 1) {
                buffer += ",";
            }
            buffer += "\n";

            if (buffer.length >= bufferThreshold || (i + 1) % batchSize === 0) {
                await this.writeToStream(stream, buffer);
                buffer = "";
            }

            if (dataArray.length > 1000 && (i + 1) % 1000 === 0) {
                console.log(`  📈 Progress: ${i + 1}/${dataArray.length} records written`);
            }
        }

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

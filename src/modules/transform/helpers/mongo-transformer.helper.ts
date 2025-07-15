import * as fs from "fs";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import { Logger } from "@nestjs/common";
import { ITransformResult } from "../interfaces/transform.interface";
import { anonymizeData } from "../utils/anonymization.util";
import { ensureDirectoryExists, generateTransformedFilename } from "../utils/file-processing.util";
import { SENSITIVE_KEYS, PRESERVE_KEYS } from "../constants/transform.constant";

export class MongoTransformer {
    private readonly logger = new Logger(MongoTransformer.name);

    async transformJsonFile(inputPath: string): Promise<ITransformResult> {
        const outputPath = generateTransformedFilename(inputPath);

        return new Promise((resolve, reject) => {
            this.processJsonStream(inputPath, outputPath)
                .then((recordCount) => {
                    resolve({
                        source: "mongo",
                        originalFile: inputPath,
                        transformedFile: outputPath,
                        recordCount,
                        timestamp: new Date(),
                    });
                })
                .catch(reject);
        });
    }

    private async processJsonStream(inputPath: string, outputPath: string): Promise<number> {
        // Ensure output directory exists
        await ensureDirectoryExists(outputPath.substring(0, outputPath.lastIndexOf("/")));

        return new Promise((resolve, reject) => {
            const jsonStream = fs.createReadStream(inputPath).pipe(parser()).pipe(streamArray());

            const outputStream = fs.createWriteStream(outputPath);
            outputStream.write("[\n");

            let isFirst = true;
            let count = 0;

            jsonStream.on("data", ({ value }: { value: unknown }) => {
                try {
                    const anonymized = anonymizeData(value, [...SENSITIVE_KEYS.MONGO], [...PRESERVE_KEYS]);

                    if (!isFirst) outputStream.write(",\n");
                    outputStream.write(JSON.stringify(anonymized, null, 2));
                    isFirst = false;
                    count++;

                    if (count % 1000 === 0) {
                        this.logger.log(`Processed ${count} documents from ${inputPath}`);
                    }
                } catch (error) {
                    this.logger.error(`Error processing document ${count}`, error);
                }
            });

            jsonStream.on("end", () => {
                outputStream.write("\n]");
                outputStream.end();
                this.logger.log(`✅ Anonymized ${count} documents and saved to ${outputPath}`);
                resolve(count);
            });

            jsonStream.on("error", (err: Error) => {
                this.logger.error("❌ JSON stream error:", err);
                reject(err);
            });

            outputStream.on("error", (err: Error) => {
                this.logger.error("❌ Output stream error:", err);
                reject(err);
            });
        });
    }

    async transformAllJsonFiles(inputDir: string): Promise<ITransformResult[]> {
        const jsonFiles = await this.getJsonFiles(inputDir);
        const results: ITransformResult[] = [];

        for (const filePath of jsonFiles) {
            try {
                const result = await this.transformJsonFile(filePath);
                results.push(result);
            } catch (error) {
                this.logger.error(`Failed to transform ${filePath}`, error);
            }
        }

        return results;
    }

    private async getJsonFiles(dirPath: string): Promise<string[]> {
        try {
            const files = await fs.promises.readdir(dirPath);
            return files.filter((file) => file.endsWith(".json")).map((file) => `${dirPath}/${file}`);
        } catch {
            return [];
        }
    }
}

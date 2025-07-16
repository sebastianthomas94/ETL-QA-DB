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
        // Validate the JSON file before processing
        const isValid = await this.validateJsonFile(inputPath);
        if (!isValid) {
            throw new Error(`Invalid JSON file: ${inputPath}`);
        }

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

        // First, validate the file exists and is not empty
        try {
            const stats = await fs.promises.stat(inputPath);
            if (stats.size === 0) {
                this.logger.warn(`Skipping empty file: ${inputPath}`);
                return 0;
            }
        } catch (error) {
            this.logger.error(`Cannot access file: ${inputPath}`, error);
            throw new Error(`File not accessible: ${inputPath}`);
        }

        return new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(inputPath, { encoding: "utf8" });
            const jsonParser = parser();
            const jsonStream = readStream.pipe(jsonParser).pipe(streamArray());

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
                this.logger.error(`❌ JSON stream error in file ${inputPath}:`, err);
                outputStream.destroy();
                reject(new Error(`Failed to parse JSON in ${inputPath}: ${err.message}`));
            });

            readStream.on("error", (err: Error) => {
                this.logger.error(`❌ Read stream error for file ${inputPath}:`, err);
                outputStream.destroy();
                reject(new Error(`Failed to read file ${inputPath}: ${err.message}`));
            });

            jsonParser.on("error", (err: Error) => {
                this.logger.error(`❌ JSON parser error in file ${inputPath}:`, err);
                outputStream.destroy();
                reject(new Error(`JSON parsing error in ${inputPath}: ${err.message}`));
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

    private async validateJsonFile(filePath: string): Promise<boolean> {
        try {
            const content = await fs.promises.readFile(filePath, "utf8");

            // Check if file is empty
            if (!content.trim()) {
                this.logger.warn(`Empty file detected: ${filePath}`);
                return false;
            }

            // Try to parse a small portion to validate JSON structure
            const trimmedContent = content.trim();
            if (!trimmedContent.startsWith("[") && !trimmedContent.startsWith("{")) {
                this.logger.warn(`Invalid JSON format (doesn't start with [ or {): ${filePath}`);
                return false;
            }

            // For very large files, just check the first few characters
            if (content.length > 1000000) {
                // 1MB
                const sample = content.substring(0, 1000);
                JSON.parse(sample.endsWith(",") ? sample.slice(0, -1) + "]" : sample + "]");
            } else {
                // For smaller files, validate the entire content
                JSON.parse(content);
            }

            return true;
        } catch (error) {
            this.logger.error(`JSON validation failed for ${filePath}:`, error);
            return false;
        }
    }
}

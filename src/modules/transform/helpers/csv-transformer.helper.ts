import * as fs from "fs";
import * as csvParser from "csv-parser";
import * as fastCsv from "fast-csv";
import { Logger } from "@nestjs/common";
import { ITransformResult } from "../interfaces/transform.interface";
import { anonymizeData } from "../utils/anonymization.util";
import { ensureDirectoryExists, generateTransformedFilename } from "../utils/file-processing.util";
import { SENSITIVE_KEYS, PRESERVE_KEYS } from "../constants/transform.constant";

export class CsvTransformer {
    private readonly logger = new Logger(CsvTransformer.name);

    async transformCsvFile(inputPath: string): Promise<ITransformResult> {
        const outputPath = generateTransformedFilename(inputPath);

        return new Promise((resolve, reject) => {
            this.processCsvStream(inputPath, outputPath)
                .then((recordCount) => {
                    resolve({
                        source: "postgres",
                        originalFile: inputPath,
                        transformedFile: outputPath,
                        recordCount,
                        timestamp: new Date(),
                    });
                })
                .catch(reject);
        });
    }

    private async processCsvStream(inputPath: string, outputPath: string): Promise<number> {
        // Ensure output directory exists
        await ensureDirectoryExists(outputPath.substring(0, outputPath.lastIndexOf("/")));

        return new Promise((resolve, reject) => {
            const records: Record<string, unknown>[] = [];
            let count = 0;
            fs.createReadStream(inputPath)
                .pipe(csvParser())
                .on("data", (row: Record<string, unknown>) => {
                    try {
                        const anonymized = anonymizeData(row, [...SENSITIVE_KEYS.CSV], [...PRESERVE_KEYS]) as Record<
                            string,
                            unknown
                        >;

                        records.push(anonymized);
                        count++;

                        if (count % 5000 === 0) {
                            this.logger.log(`Processed ${count} rows from ${inputPath}`);
                        }
                    } catch (error) {
                        this.logger.error(`Error processing row ${count}`, error);
                    }
                })
                .on("end", () => {
                    // Write all records to output CSV
                    const writeStream = fs.createWriteStream(outputPath);

                    fastCsv
                        .write(records, { headers: true })
                        .pipe(writeStream)
                        .on("finish", () => {
                            this.logger.log(`✅ Anonymized ${count} rows and saved to ${outputPath}`);
                            resolve(count);
                        })
                        .on("error", (err: Error) => {
                            this.logger.error("❌ CSV write error:", err);
                            reject(err);
                        });
                })
                .on("error", (err: Error) => {
                    this.logger.error("❌ CSV read error:", err);
                    reject(err);
                });
        });
    }

    async transformAllCsvFiles(inputDir: string): Promise<ITransformResult[]> {
        const csvFiles = await this.getCsvFiles(inputDir);
        const results: ITransformResult[] = [];

        for (const filePath of csvFiles) {
            try {
                const result = await this.transformCsvFile(filePath);
                results.push(result);
            } catch (error) {
                this.logger.error(`Failed to transform ${filePath}`, error);
            }
        }

        return results;
    }

    private async getCsvFiles(dirPath: string): Promise<string[]> {
        try {
            const files = await fs.promises.readdir(dirPath);
            return files.filter((file) => file.endsWith(".csv")).map((file) => `${dirPath}/${file}`);
        } catch {
            return [];
        }
    }
}

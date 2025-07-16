import { Injectable, Logger } from "@nestjs/common";
import { MongoTransformer } from "./helpers/mongo-transformer.helper";
import { CsvTransformer } from "./helpers/csv-transformer.helper";
import { ITransformSummary, ITransformResult } from "./interfaces/transform.interface";
import { EXTRACT_PATHS } from "@common/constant/file-path.constant";

@Injectable()
export class TransformService {
    private readonly logger = new Logger(TransformService.name);

    async run(): Promise<ITransformSummary> {
        const startTime = new Date();
        this.logger.log("Starting transformation process...");

        const results: ITransformResult[] = [];

        try {
            // Transform MongoDB JSON files
            const mongoResults = await this.transformMongoData();
            results.push(...mongoResults);

            // Transform PostgreSQL CSV files
            const csvResults = await this.transformCsvData();
            results.push(...csvResults);

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const totalRecords = results.reduce((sum, result) => sum + result.recordCount, 0);

            const summary: ITransformSummary = {
                results,
                totalRecords,
                startTime,
                endTime,
                duration,
            };

            this.logger.log(
                `Transformation completed: ${results.length} files processed, ${totalRecords} total records in ${duration}ms`,
            );

            return summary;
        } catch (error) {
            this.logger.error("Transformation failed", error);
            throw error;
        }
    }

    private async transformMongoData(): Promise<ITransformResult[]> {
        const mongoTransformer = new MongoTransformer();

        try {
            const results = await mongoTransformer.transformAllJsonFiles(EXTRACT_PATHS.MONGO);
            this.logger.log(`MongoDB transformation completed: ${results.length} files processed`);
            return results;
        } catch (error) {
            this.logger.error("MongoDB transformation failed", error);
            throw error;
        }
    }

    private async transformCsvData(): Promise<ITransformResult[]> {
        const csvTransformer = new CsvTransformer();

        try {
            const results = await csvTransformer.transformAllCsvFiles(EXTRACT_PATHS.POSTGRES);
            this.logger.log(`CSV transformation completed: ${results.length} files processed`);
            return results;
        } catch (error) {
            this.logger.error("CSV transformation failed", error);
            throw error;
        }
    }

    async transformSpecificFile(filePath: string): Promise<ITransformResult> {
        this.logger.log(`Transforming specific file: ${filePath}`);

        if (filePath.endsWith(".json")) {
            const mongoTransformer = new MongoTransformer();
            return await mongoTransformer.transformJsonFile(filePath);
        } else if (filePath.endsWith(".csv")) {
            const csvTransformer = new CsvTransformer();
            return await csvTransformer.transformCsvFile(filePath);
        } else {
            throw new Error(`Unsupported file type: ${filePath}`);
        }
    }
}

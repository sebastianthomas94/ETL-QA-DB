import { Injectable, Logger } from "@nestjs/common";
import { EnvironmentService } from "../../common/global/environment.service";
import { MongoHelper } from "./helpers/mongo.helper";
import { PostgresHelper } from "./helpers/postgres.helper";
import { IExtractSummary, IExtractResult } from "./interfaces/extract.interface";
import { ExtractionTrackerService } from "./services/extraction-tracker.service";

@Injectable()
export class ExtractService {
    private readonly logger = new Logger(ExtractService.name);

    constructor(
        private readonly environmentService: EnvironmentService,
        private readonly extractionTracker: ExtractionTrackerService,
    ) {}

    async run(): Promise<IExtractSummary> {
        const startTime = new Date();
        this.logger.log("Starting extraction process...");

        const results: IExtractResult[] = [];

        // Get last extraction time
        const lastExtractionTime = this.extractionTracker.getLastExtractionTime();
        if (lastExtractionTime) {
            this.logger.log(`Last extraction: ${lastExtractionTime.toISOString()}`);
        } else {
            this.logger.log("No previous extraction found, performing full extraction");
        }

        try {
            // Extract from production MongoDB and PostgreSQL only
            const mongoResults = await this.dumpMongo(lastExtractionTime);
            results.push(...mongoResults);

            const pgResults = await this.dumpPg(lastExtractionTime);
            results.push(...pgResults);

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const totalRecords = results.reduce((sum, result) => sum + result.recordCount, 0);

            // Save current extraction time
            this.extractionTracker.saveExtractionTime(startTime);

            const summary: IExtractSummary = {
                results,
                totalRecords,
                startTime,
                endTime,
                duration,
            };

            this.logger.log(
                `Extraction completed: ${results.length} sources, ${totalRecords} total records in ${duration}ms`,
            );

            return summary;
        } catch (error) {
            this.logger.error(`Extraction failed: ${error}`);
            throw error;
        }
    }

    private async dumpMongo(lastExtractionTime?: Date | null): Promise<IExtractResult[]> {
        const mongoHelper = new MongoHelper();

        try {
            const config = this.environmentService.productionMongo;

            await mongoHelper.connect(config);

            const collectionNames = this.environmentService.mongoCollectionNames;
            const results = await mongoHelper.extractAllCollections(
                collectionNames.length > 0 ? collectionNames : undefined,
                lastExtractionTime,
            );

            this.logger.log(`MongoDB PROD extraction completed: ${results.length} collections`);
            return results;
        } catch (error) {
            this.logger.error(`MongoDB PROD extraction failed: ${error}`);
            throw error;
        } finally {
            await mongoHelper.disconnect();
        }
    }

    private async dumpPg(lastExtractionTime?: Date | null): Promise<IExtractResult[]> {
        const pgHelper = new PostgresHelper();

        try {
            const config = this.environmentService.productionPostgres;

            await pgHelper.connect(config);

            const tableNames = this.environmentService.pgTableNames;
            const results = await pgHelper.extractAllTables(
                tableNames.length > 0 ? tableNames : undefined,
                lastExtractionTime,
            );

            this.logger.log(`PostgreSQL PROD extraction completed: ${results.length} tables`);
            return results;
        } catch (error) {
            this.logger.error(`PostgreSQL PROD extraction failed: ${error}`);
            throw error;
        } finally {
            await pgHelper.disconnect();
        }
    }
}

import { Injectable, Logger } from "@nestjs/common";
import { ExtractService } from "@modules/extract/extract.service";
import { IETLPipelineResult } from "./interfaces/etl-pipeline.interface";
import { TransformService } from "@modules/transform/transform.service";
import { LoadService } from "@modules/load/load.service";
import { AssetsLoadService } from "@modules/load/services/assets-load.service";

@Injectable()
export class ETLPipelineService {
    private readonly logger = new Logger(ETLPipelineService.name);

    constructor(
        private readonly extractService: ExtractService,
        private readonly transformService: TransformService,
        private readonly loadService: LoadService,
        private readonly assetsService: AssetsLoadService,
    ) {}

    async runFullPipeline(): Promise<IETLPipelineResult> {
        const pipelineStartTime = new Date();
        this.logger.log("🚀 Starting full ETL pipeline...");

        try {
            // Step 1: Extract data from production databases
            this.logger.log("📤 Phase 1: Extracting data from production databases...");
            const extractSummary = await this.extractService.run();
            this.logger.log(
                `✅ Extraction completed: ${extractSummary.totalRecords} records in ${extractSummary.duration}ms`,
            );

            // Step 2: Transform and anonymize the extracted data
            this.logger.log("🔄 Phase 2: Transforming and anonymizing data...");
            const transformSummary = await this.transformService.run();
            this.logger.log(
                `✅ Transformation completed: ${transformSummary.totalRecords} records in ${transformSummary.duration}ms`,
            );

            // Step 3: Load transformed data into QA databases
            this.logger.log("📥 Phase 3: Loading data into QA databases...");
            const loadSummary = await this.loadService.run();
            this.logger.log(`✅ Load completed: ${loadSummary.totalRecords} records in ${loadSummary.duration}ms`);

            const pipelineEndTime = new Date();
            const totalDuration = pipelineEndTime.getTime() - pipelineStartTime.getTime();

            this.logger.log("📦 Phase 4: Migrating assets to QA...");
            await this.assetsService.migrateAssets();

            const result: IETLPipelineResult = {
                extract: {
                    totalRecords: extractSummary.totalRecords,
                    duration: extractSummary.duration,
                    files: extractSummary.results.length,
                },
                transform: {
                    totalRecords: transformSummary.totalRecords,
                    duration: transformSummary.duration,
                    files: transformSummary.results.length,
                },
                load: {
                    totalRecords: loadSummary.totalRecords,
                    duration: loadSummary.duration,
                    collections: loadSummary.results.filter((r) => r.source === "mongo").length,
                    tables: loadSummary.results.filter((r) => r.source === "postgres").length,
                },
                totalDuration,
                success: true,
            };

            this.logger.log(`🎉 Full ETL pipeline completed successfully!`);
            this.logger.log(`📊 Summary: ${result.load.totalRecords} records processed in ${totalDuration}ms`);
            this.logger.log(
                `🗄️ Databases: ${result.load.collections} MongoDB collections, ${result.load.tables} PostgreSQL tables`,
            );

            return result;
        } catch (error) {
            const pipelineEndTime = new Date();
            const totalDuration = pipelineEndTime.getTime() - pipelineStartTime.getTime();

            this.logger.error("❌ ETL Pipeline failed:" + JSON.stringify(error, null, 2));

            return {
                extract: { totalRecords: 0, duration: 0, files: 0 },
                transform: { totalRecords: 0, duration: 0, files: 0 },
                load: { totalRecords: 0, duration: 0, collections: 0, tables: 0 },
                totalDuration,
                success: false,
            };
        }
    }

    async getQADatabaseStats(): Promise<{
        mongo: Record<string, { count: number; size: number | string }>;
        postgres: Record<string, { count: number; size: string }>;
    }> {
        this.logger.log("📈 Retrieving QA database statistics...");
        return await this.loadService.getLoadStats();
    }
}

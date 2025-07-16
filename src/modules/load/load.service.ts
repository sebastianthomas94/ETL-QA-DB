import { Injectable, Logger } from "@nestjs/common";
import { EnvironmentService } from "../../common/global/environment.service";
import { MongoLoader } from "./helpers/mongo-loader.helper";
import { PostgresLoader } from "./helpers/postgres-loader.helper";
import { ILoadSummary, ILoadResult } from "./interfaces/load.interface";
import { getTransformedMongoFiles, getTransformedCsvFiles } from "./utils/file-processing.util";
import { TRANSFORM_PATHS } from "@common/constant/file-path.constant";

@Injectable()
export class LoadService {
    private readonly logger = new Logger(LoadService.name);

    constructor(private readonly environmentService: EnvironmentService) {}

    async run(): Promise<ILoadSummary> {
        const startTime = new Date();
        this.logger.log("Starting load process...");

        const results: ILoadResult[] = [];

        try {
            // Load MongoDB data to QA
            const mongoResults = await this.loadMongoData();
            results.push(...mongoResults);

            // Load PostgreSQL data to QA
            const pgResults = await this.loadPostgresData();
            results.push(...pgResults);

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const totalRecords = results.reduce((sum, result) => sum + result.recordCount, 0);

            const summary: ILoadSummary = {
                results,
                totalRecords,
                startTime,
                endTime,
                duration,
            };

            this.logger.log(
                `Load completed: ${results.length} files processed, ${totalRecords} total records in ${duration}ms`,
            );

            return summary;
        } catch (error) {
            this.logger.error("Load process failed", error);
            throw error;
        }
    }

    private async loadMongoData(): Promise<ILoadResult[]> {
        const mongoLoader = new MongoLoader();

        try {
            const config = this.environmentService.qaMongo;
            await mongoLoader.connect(config);

            // Get all transformed JSON files
            const fileInfos = await getTransformedMongoFiles(TRANSFORM_PATHS.MONGO);

            if (fileInfos.length === 0) {
                this.logger.warn("No transformed MongoDB files found to load");
                return [];
            }

            this.logger.log(`Found ${fileInfos.length} MongoDB files to load`);
            const results = await mongoLoader.loadAllJsonFiles(fileInfos);

            this.logger.log(`MongoDB load completed: ${results.length} collections loaded`);
            return results;
        } catch (error) {
            this.logger.error("MongoDB load failed", error);
            throw error;
        } finally {
            await mongoLoader.disconnect();
        }
    }

    private async loadPostgresData(): Promise<ILoadResult[]> {
        const pgLoader = new PostgresLoader();

        try {
            const config = this.environmentService.qaPostgres;
            await pgLoader.connect(config);

            // Get all transformed CSV files
            const fileInfos = await getTransformedCsvFiles(TRANSFORM_PATHS.POSTGRES);

            if (fileInfos.length === 0) {
                this.logger.warn("No transformed PostgreSQL files found to load");
                return [];
            }

            this.logger.log(`Found ${fileInfos.length} PostgreSQL files to load`);
            const results = await pgLoader.loadAllCsvFiles(fileInfos);

            this.logger.log(`PostgreSQL load completed: ${results.length} tables loaded`);
            return results;
        } catch (error) {
            this.logger.error("PostgreSQL load failed", error);
            throw error;
        } finally {
            await pgLoader.disconnect();
        }
    }

    async getLoadStats(): Promise<{
        mongo: Record<string, { count: number; size: number | string }>;
        postgres: Record<string, { count: number; size: string }>;
    }> {
        const stats = {
            mongo: {} as Record<string, { count: number; size: number | string }>,
            postgres: {} as Record<string, { count: number; size: string }>,
        };

        // Get MongoDB stats
        const mongoLoader = new MongoLoader();
        try {
            await mongoLoader.connect(this.environmentService.qaMongo);
            const mongoFiles = await getTransformedMongoFiles(TRANSFORM_PATHS.MONGO);

            for (const fileInfo of mongoFiles) {
                const collectionStats = await mongoLoader.getCollectionStats(fileInfo.collectionOrTableName);
                stats.mongo[fileInfo.collectionOrTableName] = collectionStats;
            }
        } catch (error) {
            this.logger.error("Failed to get MongoDB stats", error);
        } finally {
            await mongoLoader.disconnect();
        }

        // Get PostgreSQL stats
        const pgLoader = new PostgresLoader();
        try {
            await pgLoader.connect(this.environmentService.qaPostgres);
            const pgFiles = await getTransformedCsvFiles(TRANSFORM_PATHS.POSTGRES);

            for (const fileInfo of pgFiles) {
                const tableStats = await pgLoader.getTableStats(fileInfo.collectionOrTableName);
                stats.postgres[fileInfo.collectionOrTableName] = tableStats;
            }
        } catch (error) {
            this.logger.error("Failed to get PostgreSQL stats", error);
        } finally {
            await pgLoader.disconnect();
        }

        return stats;
    }
}

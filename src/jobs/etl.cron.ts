import { ETLPipelineService } from "@modules/etl-pipeline/etl-pipeline.service";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { promises as fs } from "fs";
import { join, resolve } from "path";

@Injectable()
export class ETLCronService {
    private readonly logger = new Logger(ETLCronService.name);
    private readonly extractedDir = resolve("output", "extracted");
    private readonly transformedDir = resolve("output", "transformed");

    constructor(private readonly etlPipelineService: ETLPipelineService) {}

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleCron() {
        await this.clearAllData();

        const result = await this.etlPipelineService.runFullPipeline();
        this.logger.log(`ETL Pipeline Result: ${JSON.stringify(result, null, 2)}`);

        const stats = await this.etlPipelineService.getQADatabaseStats();
        this.logger.log(`QA Database Stats: ${JSON.stringify(stats, null, 2)}`);

        await this.clearExtractedData();
    }

    private async clearExtractedData() {
        try {
            await this.deleteDirectoryContents(this.extractedDir);
            this.logger.log("Extracted data directory cleared");
        } catch (error) {
            this.logger.error(`Failed to clear extracted data: ${error.message}`);
        }
    }

    private async clearTransformedData() {
        try {
            await this.deleteDirectoryContents(this.transformedDir);
            this.logger.log("Transformed data directory cleared");
        } catch (error) {
            this.logger.error(`Failed to clear transformed data: ${error.message}`);
        }
    }

    private async clearAllData() {
        await this.clearExtractedData();
        await this.clearTransformedData();
    }

    private async deleteDirectoryContents(directoryPath: string) {
        try {
            const files = await fs.readdir(directoryPath);
            await Promise.all(
                files.map(async (file) => {
                    const filePath = join(directoryPath, file);
                    const stat = await fs.lstat(filePath);
                    if (stat.isDirectory()) {
                        await fs.rm(filePath, { recursive: true, force: true });
                    } else {
                        await fs.unlink(filePath);
                    }
                }),
            );
        } catch (error) {
            this.logger.error(`Failed to delete contents of directory ${directoryPath}: ${error.message}`);
            throw error;
        }
    }
}

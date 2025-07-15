import { Controller, Post, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ExtractService } from "./extract.service";
import { IExtractSummary } from "./interfaces/extract.interface";

@ApiTags("Extract")
@Controller("extract")
export class ExtractController {
    private readonly logger = new Logger(ExtractController.name);

    constructor(private readonly extractService: ExtractService) {}

    @Post("run")
    @ApiOperation({
        summary: "Run extraction process",
        description: "Extracts data from production MongoDB and PostgreSQL databases",
    })
    @ApiResponse({
        status: 200,
        description: "Extraction completed successfully",
        schema: {
            type: "object",
            properties: {
                results: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            source: { type: "string", enum: ["mongo", "postgres"] },
                            collectionName: { type: "string" },
                            tableName: { type: "string" },
                            recordCount: { type: "number" },
                            filePath: { type: "string" },
                            timestamp: { type: "string", format: "date-time" },
                        },
                    },
                },
                totalRecords: { type: "number" },
                startTime: { type: "string", format: "date-time" },
                endTime: { type: "string", format: "date-time" },
                duration: { type: "number" },
            },
        },
    })
    @ApiResponse({ status: 500, description: "Extraction failed" })
    async runExtraction(): Promise<IExtractSummary> {
        this.logger.log("Starting extraction via API");
        return await this.extractService.run();
    }
}

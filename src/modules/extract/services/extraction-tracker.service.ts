import { Injectable, Logger } from "@nestjs/common";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

interface IExtractionDate {
    "last-extraction-time": string;
}

// Service for tracking extraction timestamps
@Injectable()
export class ExtractionTrackerService {
    private readonly logger = new Logger(ExtractionTrackerService.name);
    private readonly outputDir = "./output";
    private readonly trackerFilePath = join(this.outputDir, "extraction-date.json");

    getLastExtractionTime(): Date | null {
        try {
            if (!existsSync(this.trackerFilePath)) {
                return null;
            }

            const data = readFileSync(this.trackerFilePath, "utf-8");
            const tracker: IExtractionDate = JSON.parse(data);

            return new Date(tracker["last-extraction-time"]);
        } catch (error) {
            this.logger.warn("Could not read extraction date file", error);
            return null;
        }
    }

    saveExtractionTime(time: Date): void {
        try {
            // Ensure output directory exists
            if (!existsSync(this.outputDir)) {
                mkdirSync(this.outputDir, { recursive: true });
            }

            const tracker: IExtractionDate = {
                "last-extraction-time": time.toISOString(),
            };

            writeFileSync(this.trackerFilePath, JSON.stringify(tracker, null, 2));
            this.logger.log("Extraction date saved successfully");
        } catch (error) {
            this.logger.error("Failed to save extraction date", error);
            throw error;
        }
    }
}

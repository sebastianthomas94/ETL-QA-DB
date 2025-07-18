import { Module } from "@nestjs/common";
import { ExtractService } from "./extract.service";
import { ExtractionTrackerService } from "./services/extraction-tracker.service";

@Module({
    imports: [],
    controllers: [],
    providers: [ExtractService, ExtractionTrackerService],
    exports: [ExtractService],
})
export class ExtractModule {}

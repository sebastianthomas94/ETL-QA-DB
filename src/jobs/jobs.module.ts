import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ETLCronService } from "./etl.cron";
import { ETLPipelineModule } from "@modules/etl-pipeline/etl-pipeline.module";

@Module({
    imports: [
        ScheduleModule.forRoot(), // Required for @Cron decorators
        ETLPipelineModule, // Import the module that provides ETLPipelineService
    ],
    providers: [ETLCronService],
    exports: [ETLCronService],
})
export class JobsModule {}

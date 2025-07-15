import { Module } from "@nestjs/common";
import { ETLPipelineService } from "./etl-pipeline.service";
import { ExtractModule } from "@modules/extract/extract.module";
import { LoadModule } from "@modules/load/load.module";
import { TransformModule } from "@modules/transform/transform.module";

@Module({
    imports: [ExtractModule, TransformModule, LoadModule],
    controllers: [],
    providers: [ETLPipelineService],
    exports: [ETLPipelineService],
})
export class ETLPipelineModule {}

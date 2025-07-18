import { HealthModule } from "@modules/health/health.module";
import { ExtractModule } from "@modules/extract/extract.module";
import { TransformModule } from "@modules/transform/transform.module";
import { LoadModule } from "@modules/load/load.module";
import { ETLPipelineModule } from "@modules/etl-pipeline/etl-pipeline.module";
import { Module } from "@nestjs/common";

@Module({
    imports: [HealthModule, ExtractModule, TransformModule, LoadModule, ETLPipelineModule],
})
export class RouteModule {}

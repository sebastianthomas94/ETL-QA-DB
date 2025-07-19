import { HealthModule } from "@modules/health/health.module";
import { ExtractModule } from "@modules/extract/extract.module";
import { Module } from "@nestjs/common";
import { TransformModule } from "@modules/transform/transform.module";

@Module({
    imports: [HealthModule, ExtractModule, TransformModule],
})
export class RouteModule {}

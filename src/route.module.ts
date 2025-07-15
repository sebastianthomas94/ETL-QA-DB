import { HealthModule } from "@modules/health/health.module";
import { ExtractModule } from "@modules/extract/extract.module";
import { TransformModule } from "@modules/transform/transform.module";
import { Module } from "@nestjs/common";

@Module({
    imports: [HealthModule, ExtractModule, TransformModule],
})
export class RouteModule {}

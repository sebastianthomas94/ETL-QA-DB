import { HealthModule } from "@modules/health/health.module";
import { ExtractModule } from "@modules/extract/extract.module";
import { Module } from "@nestjs/common";

@Module({
    imports: [HealthModule, ExtractModule],
})
export class RouteModule {}

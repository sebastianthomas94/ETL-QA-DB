import { HealthModule } from "@modules/health/health.module";
import { Module } from "@nestjs/common";

@Module({
    imports: [HealthModule],
})
export class RouteModule {}

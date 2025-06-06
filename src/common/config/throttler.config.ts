import { EnvironmentService } from "@common/global/environment.service";
import { ThrottlerModuleOptions } from "@nestjs/throttler";

export const throttlerConfig = (envService: EnvironmentService): ThrottlerModuleOptions => [
    {
        name: "short",
        ttl: 1000,
        limit: envService.isProduction ? 3 : 10, // 3 requests per second in production, 10 in development
    },
    {
        name: "long",
        ttl: 60000,
        limit: 100,
    },
];

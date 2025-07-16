import { Module } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { pinoConfig } from "@common/config/pino.config";
import { RouteModule } from "./route.module";
import { APP_GUARD } from "@nestjs/core";
import { GlobalModule } from "@common/global/global.module";
import { EnvironmentService } from "@common/global/environment.service";
import { throttlerConfig } from "@common/config/throttler.config";
import { JobsModule } from "./jobs/jobs.module";

@Module({
    imports: [
        GlobalModule,
        ThrottlerModule.forRootAsync({
            useFactory: (envService: EnvironmentService) => throttlerConfig(envService),
            inject: [EnvironmentService],
        }),
        LoggerModule.forRootAsync({
            useFactory: (envService) => pinoConfig(envService),
            inject: [EnvironmentService],
        }),
        RouteModule,
        JobsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}

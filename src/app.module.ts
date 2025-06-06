import { Module } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { THROTTLER_CONFIG } from "./common/config/throttler.config";
import { LoggerModule } from "nestjs-pino";
import { pinoConfig } from "@common/config/pino.config";
import { RouteModule } from "./route.module";
import { APP_GUARD } from "@nestjs/core";
import { GlobalModule } from "@common/global/global.module";

@Module({
    imports: [GlobalModule, ThrottlerModule.forRoot(THROTTLER_CONFIG), LoggerModule.forRoot(pinoConfig), RouteModule],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "@nestjs/config";
import { validate } from "./common/config/env.config";
import { THROTTLER_CONFIG } from "./common/config/throttler.config";
import { EnvironmentService } from "./common/services/environment.service";
import { LoggerModule } from "nestjs-pino";
import { pinoConfig } from "@common/config/pino.config";
import { RouteModule } from "./route.module";
import { AppMiddlewareModule } from "@common/middlewares/app-middleware.module";

@Module({
    imports: [
        ConfigModule.forRoot({ validate }),
        ThrottlerModule.forRoot(THROTTLER_CONFIG),
        LoggerModule.forRoot(pinoConfig),
        AppMiddlewareModule,
        RouteModule,
    ],
    controllers: [AppController],
    providers: [AppService, EnvironmentService],
})
export class AppModule {}

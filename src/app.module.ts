import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "@nestjs/config";
import { validate } from "./common/config/env.config";
import { THROTTLER_CONFIG } from "./common/config/throttler.config";
import { EnvironmentService } from "./common/services/environment.service";
import { APP_GUARD } from "@nestjs/core";

@Module({
    imports: [ConfigModule.forRoot({ validate }), ThrottlerModule.forRoot(THROTTLER_CONFIG)],
    controllers: [AppController],
    providers: [
        AppService,
        EnvironmentService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}

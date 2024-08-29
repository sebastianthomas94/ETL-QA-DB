import { AllExceptionsFilter } from "@common/filter/all-exceptions.filter";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import helmet from "helmet";

@Module({
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppMiddlewareModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(helmet()).forRoutes("*");
    }
}

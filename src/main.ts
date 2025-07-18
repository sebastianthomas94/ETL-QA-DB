import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule } from "@nestjs/swagger";
import { swaggerConfig } from "./common/config/swagger.config";
import { EnvironmentService } from "./common/global/environment.service";
import { corsConfig } from "./common/config/cors.config";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { AllExceptionsFilter } from "@common/filter/all-exceptions.filter";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { MemoryMonitor } from "./common/utils/memory-monitor.util";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const envService = app.get(EnvironmentService);

    const { httpAdapter } = app.get(HttpAdapterHost);

    app.use(helmet());
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    app.setGlobalPrefix("api");
    app.enableCors(corsConfig);
    app.useGlobalPipes(
        new ValidationPipe({
            disableErrorMessages: envService.isProduction,
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
        }),
    );

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: "1",
    });

    const logger = app.get<Logger>(Logger);
    app.useLogger(logger);

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);

    // Start memory monitoring in development
    if (!envService.isProduction) {
        MemoryMonitor.startMonitoring(30000); // Monitor every 30 seconds
    }

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

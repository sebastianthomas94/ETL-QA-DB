import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule } from "@nestjs/swagger";
import { swaggerConfig } from "./common/config/swagger.config";
import { EnvironmentService } from "./common/services/environment.service";
import { corsConfig } from "./common/config/cors.config";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const envService = app.get(EnvironmentService);

    app.setGlobalPrefix("api");
    app.enableCors(corsConfig);

    app.useGlobalPipes(
        new ValidationPipe({
            disableErrorMessages: envService.NODE_ENV == "production",
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

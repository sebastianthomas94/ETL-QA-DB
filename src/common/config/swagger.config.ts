import { DocumentBuilder } from "@nestjs/swagger";

const PORT = process.env.PORT ?? 3000;
const LocalEnvironment = `http://localhost:${PORT}`;

export const swaggerConfig = new DocumentBuilder()
    .setTitle("API Documentation")
    .setDescription("This is a boilerplate API documentation you can change it as you like.")
    .addServer(LocalEnvironment, "Local Environment")
    .setVersion("1.0")
    .addTag("Students")
    .addBearerAuth()
    .build();

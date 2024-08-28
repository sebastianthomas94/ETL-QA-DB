export const pinoConfig = {
    pinoHttp: {
        name: "Pino Logger",
        level: process.env.NODE_ENV !== "production"? "debug": "info",
        transport: process.env.NODE_ENV !== "production"? {target: "pino-pretty"}: undefined,
        autoLogging: false,
    }
}
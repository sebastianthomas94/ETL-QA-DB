import { EnvironmentService } from "@common/global/environment.service";
import { randomUUID } from "crypto";
import { Params } from "nestjs-pino";

export const pinoConfig = (envService: EnvironmentService): Params => ({
    pinoHttp: {
        name: "Pino Logger",
        level: envService.isProduction ? "info" : "debug",
        transport: envService.isProduction ? undefined : { target: "pino-pretty" },
        autoLogging: false,
        quietReqLogger: true,
        genReqId: () => randomUUID(),
    },
});

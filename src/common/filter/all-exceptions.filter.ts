import { snakeCaseToTitleCase } from "@common/utils/snake-case-to-title-case.util";
import { Catch, ArgumentsHost, HttpStatus, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request, Response } from "express";

export type ErrorResponse = {
    statusCode: number;
    timestamp: string;
    path: string;
    response: string;
};

type HttpExceptionResponse = {
    statusCode: number;
    error?: string;
    message: string | string[];
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const statusCode =
            exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const statusName = HttpStatus[statusCode] ?? HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR];
        let errorMessage = snakeCaseToTitleCase(statusName.toLocaleLowerCase());

        if (exception instanceof HttpException) {
            const errorObject = exception.getResponse() as HttpExceptionResponse;
            const errMsg: string | undefined = Array.isArray(errorObject.message)
                ? errorObject.message.join(", ")
                : errorObject.message;
            if (errMsg) errorMessage = errMsg;
        }

        const myResponseObj: ErrorResponse = {
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            response: errorMessage,
        };

        response.status(statusCode).json(myResponseObj);

        super.catch(exception, host);
    }
}

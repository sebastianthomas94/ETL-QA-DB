import { applyDecorators } from "@nestjs/common";
import {
    ApiInternalServerErrorResponse,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiRequestTimeoutResponse,
} from "@nestjs/swagger";
import { InternalServerError } from "./dtos/internal-server-error.dto";
import { NotFoundError } from "./dtos/not-found-error.dto";
import { BadRequestError } from "./dtos/bad-request-error.dto";
import { RequestTimeOutError } from "./dtos/timeout-request.dto";
import { UnauthorizedError } from "./dtos/unauthorized-error.dto";
import { ConflictError } from "./dtos/conflict-error.dto";

interface ApiErrorResponseOptions {
    timeout?: boolean;
    internalServerError?: boolean;
    unauthorized?: boolean;
    notFound?: boolean;
    badRequest?: boolean;
    conflict?: boolean;
}

export function ApiErrorResponse(options: ApiErrorResponseOptions) {
    const decorators = [];

    if (options.internalServerError) {
        decorators.push(
            ApiInternalServerErrorResponse({
                description: "Internal server error.",
                type: InternalServerError,
            }),
        );
    }

    if (options.unauthorized) {
        decorators.push(
            ApiUnauthorizedResponse({
                description: "Unauthorized.",
                type: UnauthorizedError,
            }),
        );
    }

    if (options.notFound) {
        decorators.push(
            ApiNotFoundResponse({
                description: "Not found.",
                type: NotFoundError,
            }),
        );
    }

    if (options.badRequest) {
        decorators.push(
            ApiBadRequestResponse({
                description: "Bad request.",
                type: BadRequestError,
            }),
        );
    }

    if (options.conflict) {
        decorators.push(
            ApiConflictResponse({
                description: "Conflict.",
                type: ConflictError,
            }),
        );
    }

    if (options.timeout) {
        decorators.push(
            ApiRequestTimeoutResponse({
                description: "Request time out",
                type: RequestTimeOutError,
            }),
        );
    }

    return applyDecorators(...decorators);
}

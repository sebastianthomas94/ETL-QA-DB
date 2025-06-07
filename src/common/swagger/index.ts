import { applyDecorators, HttpStatus } from "@nestjs/common";
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

type SupportedErrors =
    | HttpStatus.INTERNAL_SERVER_ERROR
    | HttpStatus.UNAUTHORIZED
    | HttpStatus.NOT_FOUND
    | HttpStatus.BAD_REQUEST
    | HttpStatus.CONFLICT
    | HttpStatus.REQUEST_TIMEOUT;

const errorsMap: Record<SupportedErrors, MethodDecorator & ClassDecorator> = {
    [HttpStatus.INTERNAL_SERVER_ERROR]: ApiInternalServerErrorResponse({
        description: "Internal server error.",
        type: InternalServerError,
    }),
    [HttpStatus.UNAUTHORIZED]: ApiUnauthorizedResponse({
        description: "Unauthorized.",
        type: UnauthorizedError,
    }),
    [HttpStatus.NOT_FOUND]: ApiNotFoundResponse({
        description: "Not found.",
        type: NotFoundError,
    }),
    [HttpStatus.BAD_REQUEST]: ApiBadRequestResponse({
        description: "Bad request.",
        type: BadRequestError,
    }),
    [HttpStatus.CONFLICT]: ApiConflictResponse({
        description: "Conflict.",
        type: ConflictError,
    }),
    [HttpStatus.REQUEST_TIMEOUT]: ApiRequestTimeoutResponse({
        description: "Request time out",
        type: RequestTimeOutError,
    }),
};

export function ApiErrorResponse(errors: SupportedErrors[]) {
    const decorators = errors.map((error) => errorsMap[error]);
    return applyDecorators(...decorators);
}

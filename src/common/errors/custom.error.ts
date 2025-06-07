import { HttpException, HttpStatus } from "@nestjs/common";

export class TooManyRequestsException extends HttpException {
    constructor(message: string) {
        super({ message: message }, HttpStatus.TOO_MANY_REQUESTS);
    }
}

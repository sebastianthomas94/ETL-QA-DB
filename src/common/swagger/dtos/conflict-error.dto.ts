export class ConflictError {
    /**
     * The status code.
     * @example 409
     */
    statusCode: number;
    /**
     * The timestamp of the error.
     * @example '2021-09-23T07:29:34.000Z'
     */
    timestamp: string;
    /**
     * The path of the request.
     * @example '/api/v1/leads'
     */
    path: string;
    /**
     * Error message.
     * @example 'An item already exists.'
     */
    response: string;
}

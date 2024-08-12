export class NotFoundError {
    /**
     * The status code.
     * @example 404
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
     * @example 'The resource was not found.'
     */
    response: string;
}

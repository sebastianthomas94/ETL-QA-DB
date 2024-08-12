export class InternalServerError {
    /**
     * The status code.
     * @example 500
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
     * The method of the request.
     * @example 'Internal server error.'
     */
    response: string;
}

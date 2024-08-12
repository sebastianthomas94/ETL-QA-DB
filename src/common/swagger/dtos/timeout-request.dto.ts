export class RequestTimeOutError {
    /**
     * The status code.
     * @example 408
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
     * @example 'The request has timed out.'
     */
    response: string;
}

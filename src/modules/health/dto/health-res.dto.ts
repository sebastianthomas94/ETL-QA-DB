export class HealthCheckResDto {
    /**
     * status of application's health
     * @example "Ok"
     */
    status: string;

    /**
     * the duration(second) of how long the process has been running
     */
    uptime: number;
}

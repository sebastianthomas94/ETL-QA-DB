export interface IDatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: {
        ca: string;
    };
}

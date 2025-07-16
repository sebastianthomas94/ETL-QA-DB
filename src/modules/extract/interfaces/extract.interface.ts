export interface IDatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: {
        ca?: string;
    };
}

export interface IMongoConfig {
    uri: string;
}

export interface IExtractResult {
    source: "mongo" | "postgres";
    collectionName?: string;
    tableName?: string;
    recordCount: number;
    filePath: string;
    timestamp: Date;
}

export interface IExtractSummary {
    results: IExtractResult[];
    totalRecords: number;
    startTime: Date;
    endTime: Date;
    duration: number;
}

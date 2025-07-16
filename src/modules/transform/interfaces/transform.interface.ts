export interface ITransformResult {
    source: "mongo" | "postgres";
    originalFile: string;
    transformedFile: string;
    recordCount: number;
    timestamp: Date;
}

export interface ITransformSummary {
    results: ITransformResult[];
    totalRecords: number;
    startTime: Date;
    endTime: Date;
    duration: number;
}

export interface IAnonymizationConfig {
    mongoSensitiveKeys: string[];
    csvSensitiveKeys: string[];
    preserveKeys: string[];
}

export interface IFileProcessingOptions {
    inputPath: string;
    outputPath: string;
    batchSize?: number;
}

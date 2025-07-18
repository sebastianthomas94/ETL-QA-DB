export interface ILoadResult {
    source: "mongo" | "postgres";
    collectionName?: string;
    tableName?: string;
    recordCount: number;
    operation: "insert" | "replace" | "upsert";
    timestamp: Date;
}

export interface ILoadSummary {
    results: ILoadResult[];
    totalRecords: number;
    startTime: Date;
    endTime: Date;
    duration: number;
}

export interface ILoadFileInfo {
    filePath: string;
    fileName: string;
    source: "mongo" | "postgres";
    collectionOrTableName: string;
}

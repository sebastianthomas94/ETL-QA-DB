export interface IETLPipelineResult {
    extract: {
        totalRecords: number;
        duration: number;
        files: number;
    };
    transform: {
        totalRecords: number;
        duration: number;
        files: number;
    };
    load: {
        totalRecords: number;
        duration: number;
        collections: number;
        tables: number;
    };
    totalDuration: number;
    success: boolean;
}

export const EXTRACT_PATHS = {
    MONGO: "output/extracted/mongo",
    POSTGRES: "output/extracted/pg",
} as const;

export const FILE_EXTENSIONS = {
    JSON: ".json",
    CSV: ".csv",
} as const;

export const CONNECTION_TIMEOUTS = {
    MONGO: 10000,
    POSTGRES: 5000,
} as const;

export const BATCH_SIZE = {
    MONGO: 1000,
    POSTGRES: 10000,
} as const;

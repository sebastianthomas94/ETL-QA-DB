export const LOAD_PATHS = {
    INPUT_MONGO: "output/transformed/mongo",
    INPUT_POSTGRES: "output/transformed/pg",
} as const;

export const FILE_EXTENSIONS = {
    JSON: ".json",
    CSV: ".csv",
} as const;

export const BATCH_SIZE = {
    MONGO_INSERT: 1000,
    POSTGRES_INSERT: 5000,
} as const;

export const LOAD_OPERATIONS = {
    DROP_AND_CREATE: "drop_and_create",
    TRUNCATE_AND_INSERT: "truncate_and_insert",
    DELETE_AND_INSERT: "delete_and_insert",
} as const;

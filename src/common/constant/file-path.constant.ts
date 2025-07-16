export const EXTRACT_PATHS = {
    ROOT: "output/extracted",
    MONGO: "output/extracted/mongo",
    POSTGRES: "output/extracted/pg",
} as const;

export const TRANSFORM_PATHS = {
    ROOT: "output/transformed",
    MONGO: "output/transformed/mongo",
    POSTGRES: "output/transformed/pg",
} as const;

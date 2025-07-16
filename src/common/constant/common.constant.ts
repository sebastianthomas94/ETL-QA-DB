/* eslint-disable no-useless-escape */
export const MONGO_PATTERN =
    /mongodb?([\+srv]*):\/\/(?:(?<login>[^\:\/\?\#\[\]\@]+)(?::(?<password>[^\:\/\?\#\[\]\@]+))?@)?(?<host>[\w\.\-]+(?::\d+)?(?:,[\w\.\-]+(?::\d+)?)*)(?:\/(?<dbname>[\w\.\-]+))?(?:\?(?<query>[\w\.\-]+=[\w\.\-]+(?:&[\w\.\-]+=[\w.\-]+)*))?/;

export const FILE_EXTENSIONS = {
    JSON: ".json",
    CSV: ".csv",
} as const;

export const CONNECTION_TIMEOUTS = {
    MONGO: 10000,
    POSTGRES: 5000,
} as const;

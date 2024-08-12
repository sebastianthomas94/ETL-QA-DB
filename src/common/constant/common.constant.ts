/* eslint-disable no-useless-escape */
export const MONGO_PATTERN =
    /mongodb?([\+srv]*):\/\/(?:(?<login>[^\:\/\?\#\[\]\@]+)(?::(?<password>[^\:\/\?\#\[\]\@]+))?@)?(?<host>[\w\.\-]+(?::\d+)?(?:,[\w\.\-]+(?::\d+)?)*)(?:\/(?<dbname>[\w\.\-]+))?(?:\?(?<query>[\w\.\-]+=[\w\.\-]+(?:&[\w\.\-]+=[\w.\-]+)*))?/;

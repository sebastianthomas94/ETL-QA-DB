export class ExtractError extends Error {
    constructor(
        message: string,
        public readonly source: "mongodb" | "postgres" | "file-system",
        public readonly originalError?: Error,
    ) {
        super(message);
        this.name = "ExtractError";
    }
}

export class MongoConnectionError extends ExtractError {
    constructor(message: string, originalError?: Error) {
        super(message, "mongodb", originalError);
        this.name = "MongoConnectionError";
    }
}

export class PostgresConnectionError extends ExtractError {
    constructor(message: string, originalError?: Error) {
        super(message, "postgres", originalError);
        this.name = "PostgresConnectionError";
    }
}

export class FileSystemError extends ExtractError {
    constructor(message: string, originalError?: Error) {
        super(message, "file-system", originalError);
        this.name = "FileSystemError";
    }
}

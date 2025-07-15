# Extract Module

The Extract module is responsible for extracting data from production MongoDB and PostgreSQL databases and saving them to local files for further processing.

## Features

-   **MongoDB Extraction**: Extracts all documents from specified collections and saves as JSON files
-   **PostgreSQL Extraction**: Extracts all rows from specified tables and saves as CSV files
-   **Flexible Configuration**: Can extract specific collections/tables or all available data
-   **Error Handling**: Robust error handling with proper logging
-   **Type Safety**: Full TypeScript support with proper interfaces

## Structure

```
src/modules/extract/
├── constants/
│   └── extract.constant.ts        # Constants for file paths, timeouts, etc.
├── helpers/
│   ├── mongo.helper.ts            # MongoDB connection and extraction logic
│   └── postgres.helper.ts         # PostgreSQL connection and extraction logic
├── interfaces/
│   └── extract.interface.ts       # TypeScript interfaces
├── utils/
│   └── file.util.ts              # File manipulation utilities
├── extract.service.ts             # Main extraction service
├── extract.controller.ts          # REST API controller
├── extract.module.ts              # NestJS module
└── index.ts                       # Module exports
```

## Configuration

The module uses environment variables for database connections:

### Production MongoDB

-   `PROD_MONGO_URI`: MongoDB connection string

### Production PostgreSQL

-   `PROD_PG_HOST`: PostgreSQL host
-   `PROD_PG_PORT`: PostgreSQL port
-   `PROD_PG_DB`: Database name
-   `PROD_PG_USER`: Username
-   `PROD_PG_PASS`: Password

### Optional Filters

-   `MONGO_COLLECTION_NAMES`: Comma-separated list of collections (if empty, extracts all)
-   `PG_TABLE_NAMES`: Comma-separated list of tables (if empty, extracts all)

## Usage

### Via API

```bash
POST /extract/run
```

### Via Service

```typescript
import { ExtractService } from '@modules/extract';

// Inject the service
constructor(private readonly extractService: ExtractService) {}

// Run extraction
const summary = await this.extractService.run();
```

## Output

Extracted data is saved to:

-   MongoDB data: `output/extracted/mongo/` (JSON files)
-   PostgreSQL data: `output/extracted/pg/` (CSV files)

Files are timestamped with the format: `{collection/table}_YYYY-MM-DDTHH-mm-ss-sssZ.{json/csv}`

## Response Format

```typescript
interface IExtractSummary {
    results: IExtractResult[];
    totalRecords: number;
    startTime: Date;
    endTime: Date;
    duration: number;
}

interface IExtractResult {
    source: "mongo" | "postgres";
    collectionName?: string;
    tableName?: string;
    recordCount: number;
    filePath: string;
    timestamp: Date;
}
```

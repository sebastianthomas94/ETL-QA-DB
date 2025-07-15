# Load Module

The Load module is responsible for loading transformed and anonymized data from local files into QA MongoDB and PostgreSQL databases. It replaces existing data to ensure QA environments have fresh, anonymized production data.

## Features

-   **Data Loading**: Loads transformed JSON files into QA MongoDB and CSV files into QA PostgreSQL
-   **Data Replacement**: Clears existing data before loading new data for consistency
-   **Dynamic Schema**: Creates PostgreSQL tables dynamically based on CSV structure
-   **Batch Processing**: Handles large datasets efficiently with configurable batch sizes
-   **Error Resilience**: Individual file failures don't stop the entire process
-   **Statistics**: Provides insights into loaded data counts and sizes

## Structure

```
src/modules/load/
├── constants/
│   └── load.constant.ts              # Paths, batch sizes, operations
├── helpers/
│   ├── mongo-loader.helper.ts        # MongoDB loading logic
│   └── postgres-loader.helper.ts     # PostgreSQL loading logic
├── interfaces/
│   └── load.interface.ts             # TypeScript interfaces
├── utils/
│   └── file-processing.util.ts       # File discovery and parsing
├── load.service.ts                   # Main loading service
├── load.module.ts                    # NestJS module
└── index.ts                          # Module exports
```

## Configuration

The module uses QA environment variables for database connections:

### QA MongoDB

-   `QA_MONGO_URI`: QA MongoDB connection string

### QA PostgreSQL

-   `QA_PG_HOST`: QA PostgreSQL host
-   `QA_PG_PORT`: QA PostgreSQL port
-   `QA_PG_DB`: QA database name
-   `QA_PG_USER`: QA username
-   `QA_PG_PASS`: QA password

## Data Flow

### Input Sources

-   **MongoDB JSON**: `output/transformed/mongo/` → QA MongoDB
-   **PostgreSQL CSV**: `output/transformed/pg/` → QA PostgreSQL

### Loading Process

1. **File Discovery**: Scans transformed directories for files
2. **Data Replacement**: Clears existing collections/tables
3. **Batch Loading**: Inserts data in configurable batches
4. **Progress Tracking**: Logs progress for large datasets
5. **Statistics**: Provides final counts and sizes

## MongoDB Loading

### Collection Management

-   Automatically determines collection name from filename
-   Clears existing documents with `deleteMany({})`
-   Inserts documents in batches of 1,000
-   Preserves original document structure and IDs

### Example Flow

```
users_2025-07-16T10-30-45-123Z.transformed.json
→ Collection: "users"
→ Clear existing documents
→ Insert new documents in batches
```

## PostgreSQL Loading

### Table Management

-   Automatically determines table name from filename
-   Drops and recreates table structure
-   Infers column data types from sample data
-   Inserts records in batches of 5,000

### Data Type Inference

-   **Numbers**: INTEGER or DECIMAL
-   **Booleans**: BOOLEAN
-   **Dates**: TIMESTAMP (if ISO format detected)
-   **Default**: TEXT

### Example Flow

```
transactions_2025-07-16T10-30-45-123Z.transformed.csv
→ Table: "transactions"
→ Drop table if exists
→ Create new table with inferred schema
→ Insert records in batches
```

## Usage

### Via Service Injection

```typescript
import { LoadService } from '@modules/load';

// Inject the service
constructor(private readonly loadService: LoadService) {}

// Load all transformed files
const summary = await this.loadService.run();

// Get statistics about loaded data
const stats = await this.loadService.getLoadStats();
```

### Via Other Modules

The Load service can be injected into other modules for programmatic access.

## Response Format

```typescript
interface ILoadSummary {
    results: ILoadResult[];
    totalRecords: number;
    startTime: Date;
    endTime: Date;
    duration: number;
}

interface ILoadResult {
    source: "mongo" | "postgres";
    collectionName?: string;
    tableName?: string;
    recordCount: number;
    operation: "insert" | "replace";
    timestamp: Date;
}
```

## Performance Features

### MongoDB

-   **Batch Size**: 1,000 documents per batch
-   **Progress Logging**: Every 5,000 documents
-   **Connection Pooling**: Efficient connection management
-   **Index Preservation**: Maintains MongoDB indexes

### PostgreSQL

-   **Batch Size**: 5,000 records per batch
-   **Progress Logging**: Every 10,000 records
-   **Prepared Statements**: Parameterized queries for safety
-   **Schema Recreation**: Fresh table structure each time

## Error Handling

-   **File-level**: Individual file failures logged but don't stop process
-   **Connection**: Database connection issues properly handled
-   **Data**: Malformed data logged with specific error details
-   **Cleanup**: Proper resource cleanup in finally blocks

## Data Safety

### MongoDB

-   Uses `deleteMany({})` to clear collections
-   Maintains document `_id` integrity
-   Preserves collection indexes and metadata

### PostgreSQL

-   Uses `DROP TABLE IF EXISTS` for clean slate
-   Creates fresh schema based on current data
-   Uses `TRUNCATE ... RESTART IDENTITY CASCADE` when appropriate

## Statistics and Monitoring

The `getLoadStats()` method provides insights:

```typescript
{
  mongo: {
    "users": { count: 1500, size: 2048576 },
    "orders": { count: 3000, size: 5242880 }
  },
  postgres: {
    "transactions": { count: 10000, size: "1.2 MB" },
    "customers": { count: 2500, size: "512 KB" }
  }
}
```

## File Naming Convention

The module expects transformed files with this naming pattern:

-   **MongoDB**: `{collection}_timestamp.transformed.json`
-   **PostgreSQL**: `{table}_timestamp.transformed.csv`

Examples:

-   `users_2025-07-16T10-30-45-123Z.transformed.json` → Collection: `users`
-   `transactions_2025-07-16T10-30-45-123Z.transformed.csv` → Table: `transactions`

## Best Practices

1. **Run sequentially**: Load after Transform module completes
2. **Monitor logs**: Check for individual file failures
3. **Verify QA data**: Use statistics to confirm data loaded correctly
4. **Backup QA**: Consider QA database backups before loading
5. **Test connections**: Ensure QA database credentials are correct

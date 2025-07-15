# ETL Integration Guide

This guide shows how to use the Extract and Transform modules together to create a complete ETL pipeline.

## Sequential Processing

### Method 1: Using Individual Services

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { ExtractService } from "@modules/extract";
import { TransformService } from "@modules/transform";

@Injectable()
export class ETLPipelineService {
    private readonly logger = new Logger(ETLPipelineService.name);

    constructor(
        private readonly extractService: ExtractService,
        private readonly transformService: TransformService,
    ) {}

    async runFullPipeline() {
        try {
            // Step 1: Extract data from production databases
            this.logger.log("Starting extraction phase...");
            const extractSummary = await this.extractService.run();
            this.logger.log(`Extraction completed: ${extractSummary.totalRecords} records extracted`);

            // Step 2: Transform and anonymize the extracted data
            this.logger.log("Starting transformation phase...");
            const transformSummary = await this.transformService.run();
            this.logger.log(`Transformation completed: ${transformSummary.totalRecords} records transformed`);

            return {
                extract: extractSummary,
                transform: transformSummary,
                totalProcessed: transformSummary.totalRecords,
            };
        } catch (error) {
            this.logger.error("ETL Pipeline failed", error);
            throw error;
        }
    }
}
```

### Method 2: Using API Endpoints

```bash
# Step 1: Extract data
curl -X POST http://localhost:3000/extract/run

# Step 2: Transform data (after extraction completes)
curl -X POST http://localhost:3000/transform/run
```

## File Flow

### 1. Production Databases

```
Production MongoDB    →    output/extracted/mongo/
Production PostgreSQL →    output/extracted/pg/
```

### 2. Extracted Data (Raw)

```
output/extracted/mongo/users_2025-07-16T10-30-45-123Z.json
output/extracted/pg/transactions_2025-07-16T10-30-45-123Z.csv
```

### 3. Transformed Data (Anonymized)

```
output/transformed/mongo/users_2025-07-16T10-30-45-123Z.transformed.json
output/transformed/pg/transactions_2025-07-16T10-30-45-123Z.transformed.csv
```

## Environment Configuration

Ensure your `.env` file contains all required database credentials:

```env
# Production MongoDB
PROD_MONGO_URI=mongodb://prod-user:password@prod-mongo:27017/production

# Production PostgreSQL
PROD_PG_HOST=prod-pg-host
PROD_PG_PORT=5432
PROD_PG_DB=production
PROD_PG_USER=prod-user
PROD_PG_PASS=prod-password

# Optional: Specific collections/tables to extract
MONGO_COLLECTION_NAMES=users,orders,products
PG_TABLE_NAMES=transactions,customers,invoices

# If empty, all collections/tables will be extracted
MONGO_COLLECTION_NAMES=
PG_TABLE_NAMES=
```

## Data Verification

After running both phases, you can verify the results:

### Check Extracted Data

```bash
# List extracted files
ls -la output/extracted/mongo/
ls -la output/extracted/pg/

# Sample content (be careful with sensitive data)
head -10 output/extracted/mongo/users_*.json
head -10 output/extracted/pg/transactions_*.csv
```

### Check Transformed Data

```bash
# List transformed files
ls -la output/transformed/mongo/
ls -la output/transformed/pg/

# Verify anonymization worked
head -10 output/transformed/mongo/users_*.json
head -10 output/transformed/pg/transactions_*.csv
```

## Error Handling

Both modules include comprehensive error handling:

1. **Individual file failures** don't stop the entire process
2. **Database connection issues** are logged and reported
3. **Streaming errors** are handled gracefully
4. **Detailed logging** helps with troubleshooting

## Performance Considerations

### Large Datasets

-   MongoDB: Uses streaming JSON parser for large files
-   PostgreSQL: Batch processing with configurable chunk sizes
-   Memory usage remains constant regardless of file size

### Parallel Processing

-   Multiple files can be processed concurrently
-   Each database type (Mongo/PG) is processed independently
-   Transform phase can start after extraction completes

## Next Steps

After transformation, the anonymized data is ready for:

1. **Loading into QA databases** (next phase of ETL)
2. **Testing and development environments**
3. **Data analysis and reporting**
4. **Compliance and audit purposes**

The transformed data maintains all structural relationships while protecting sensitive information, making it perfect for non-production use cases.

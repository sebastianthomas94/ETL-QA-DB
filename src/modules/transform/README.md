# Transform Module

The Transform module is responsible for anonymizing and transforming extracted data while preserving database identifiers and relationships. It processes JSON files from MongoDB and CSV files from PostgreSQL, replacing sensitive information with fake data.

## Features

-   **Data Anonymization**: Replaces sensitive personal information with realistic fake data
-   **Structure Preservation**: Maintains original data structure and relationships
-   **ID Preservation**: Keeps database identifiers intact for referential integrity
-   **Streaming Processing**: Handles large files efficiently using streaming
-   **Flexible Configuration**: Configurable sensitive fields and preservation rules
-   **Error Handling**: Robust error handling with detailed logging

## Structure

```
src/modules/transform/
├── constants/
│   └── transform.constant.ts           # Sensitive keys, preserve keys, paths
├── helpers/
│   ├── mongo-transformer.helper.ts     # JSON file transformation logic
│   └── csv-transformer.helper.ts       # CSV file transformation logic
├── interfaces/
│   └── transform.interface.ts          # TypeScript interfaces
├── utils/
│   ├── anonymization.util.ts           # Core anonymization logic
│   └── file-processing.util.ts         # File manipulation utilities
├── transform.service.ts                # Main transformation service
├── transform.module.ts                 # NestJS module
└── index.ts                           # Module exports
```

## Anonymization Strategy

### MongoDB (JSON Files)

Sensitive fields that get anonymized:

-   **Names**: `name`, `firstName`, `lastName`, `fullName`
-   **Contact**: `email`, `phone`, `phoneNumber`, `mobile`
-   **Address**: `address`, `streetAddress`, `city`, `state`, `zipCode`, `postalCode`
-   **Financial**: `ssn`, `bankAccount`, `creditCard`, `accountNumber`

### PostgreSQL (CSV Files)

Additional sensitive fields for CSV:

-   **Account Info**: `accountName`, `accountIdentifier`
-   **Contact Info**: `contactNumber`

### Preserved Fields

These fields are never anonymized to maintain data integrity:

-   **IDs**: `_id`, `id`, `transactionId`, `userId`, `customerId`, `orderId`
-   **Timestamps**: `createdAt`, `updatedAt`, `timestamp`, `date`
-   **Metadata**: `version`, `__v`

## Fake Data Generation

The module uses `@faker-js/faker` to generate realistic fake data:

-   **Names**: `faker.person.fullName()`, `faker.person.firstName()`
-   **Email**: `faker.internet.email()`
-   **Phone**: `faker.phone.number()`
-   **Address**: `faker.location.streetAddress()`, `faker.location.city()`
-   **Financial**: `faker.finance.accountNumber()`, `faker.finance.creditCardNumber()`

## Usage

### Via Service

```typescript
import { TransformService } from '@modules/transform';

// Inject the service
constructor(private readonly transformService: TransformService) {}

// Transform all files
const summary = await this.transformService.run();

// Transform specific file
const result = await this.transformService.transformSpecificFile(filePath);
```

## Input/Output

### Input Directories

-   MongoDB JSON files: `output/extracted/mongo/`
-   PostgreSQL CSV files: `output/extracted/pg/`

### Output Directories

-   Transformed JSON files: `output/transformed/mongo/`
-   Transformed CSV files: `output/transformed/pg/`

### File Naming

Transformed files follow the pattern: `{original_name}.transformed.{extension}`

Example:

-   Input: `users_2025-07-16T10-30-45-123Z.json`
-   Output: `users_2025-07-16T10-30-45-123Z.transformed.json`

## Response Format

```typescript
interface ITransformSummary {
    results: ITransformResult[];
    totalRecords: number;
    startTime: Date;
    endTime: Date;
    duration: number;
}

interface ITransformResult {
    source: "mongo" | "postgres";
    originalFile: string;
    transformedFile: string;
    recordCount: number;
    timestamp: Date;
}
```

## Example Transformation

### Before (Original Data)

```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "accountNumber": "123456789",
    "createdAt": "2025-07-16T10:30:45Z"
}
```

### After (Anonymized Data)

```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice Johnson",
    "email": "alice.johnson@example.org",
    "phone": "+1-555-987-6543",
    "accountNumber": "987654321",
    "createdAt": "2025-07-16T10:30:45Z"
}
```

## Performance Features

-   **Streaming**: Processes large files without loading entirely into memory
-   **Batch Processing**: Logs progress every 1000 (JSON) or 5000 (CSV) records
-   **Parallel Processing**: Can process multiple files concurrently
-   **Memory Efficient**: Uses Node.js streams for optimal memory usage

## Error Handling

-   Individual file failures don't stop the entire process
-   Detailed logging for each transformation step
-   Graceful handling of malformed data
-   Proper cleanup of resources

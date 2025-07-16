# Complete ETL Server Documentation

This ETL (Extract, Transform, Load) server provides a comprehensive solution for migrating production data to QA environments with proper anonymization.

## 🏗️ Architecture Overview

```
Production DBs → Extract → Transform → Load → QA DBs
     ↓             ↓          ↓         ↓        ↓
MongoDB/PG    JSON/CSV    Anonymized  Fresh   MongoDB/PG
              Files       Data        Load    (QA)
```

## 📋 Modules

### 1. **Extract Module** (`/extract`)

-   **Purpose**: Extracts data from production MongoDB and PostgreSQL
-   **Output**: Raw data files in `output/extracted/`

### 2. **Transform Module** (`/transform`)

-   **Purpose**: Anonymizes sensitive data while preserving structure
-   **Input**: `output/extracted/`
-   **Output**: `output/transformed/`

### 3. **Load Module** (`/load`)

-   **Purpose**: Loads anonymized data into QA databases
-   **Input**: `output/transformed/`
-   **Output**: QA MongoDB & PostgreSQL databases

### 4. **ETL Pipeline Module** (`/etl`)

-   **Purpose**: Orchestrates the complete Extract → Transform → Load flow

## 🚀 Quick Start

### 1. Environment Setup

```env
# Production MongoDB
PROD_MONGO_URI=mongodb://prod-user:pass@prod-host:27017/production

# Production PostgreSQL
PROD_PG_HOST=prod-host
PROD_PG_PORT=5432
PROD_PG_DB=production
PROD_PG_USER=prod-user
PROD_PG_PASS=prod-pass

# SSL Certificate (required in production)
PG_SSL_CA=LS0tLS1CRUdJTi...base64-encoded-cert...0tLQo=

# QA MongoDB
QA_MONGO_URI=mongodb://qa-user:pass@qa-host:27017/qa

# QA PostgreSQL
QA_PG_HOST=qa-host
QA_PG_PORT=5432
QA_PG_DB=qa
QA_PG_USER=qa-user
QA_PG_PASS=qa-pass

# Optional: Specific collections/tables (comma-separated)
MONGO_COLLECTION_NAMES=users,orders,products
PG_TABLE_NAMES=transactions,customers,invoices
```

# Check file outputs

ls -la output/extracted/mongo/
ls -la output/extracted/pg/
ls -la output/transformed/mongo/
ls -la output/transformed/pg/

````

## 🔐 Data Anonymization

### Sensitive Fields (Anonymized)
- **Personal**: `name`, `firstName`, `lastName`, `email`
- **Contact**: `phone`, `phoneNumber`, `mobile`, `contactNumber`
- **Address**: `address`, `streetAddress`, `city`, `state`, `zipCode`
- **Financial**: `ssn`, `bankAccount`, `creditCard`, `accountNumber`
- **Business**: `accountName`, `accountIdentifier`

### Preserved Fields (Never Anonymized)
- **IDs**: `_id`, `id`, `transactionId`, `userId`, `customerId`, `orderId`
- **Timestamps**: `createdAt`, `updatedAt`, `timestamp`, `date`
- **Metadata**: `version`, `__v`

### Example Transformation
```json
// Before (Production)
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "phone": "+1-555-123-4567",
  "accountNumber": "ACC-123456",
  "createdAt": "2025-07-16T10:30:45Z"
}

// After (QA)
{
  "_id": "507f1f77bcf86cd799439011", // Preserved
  "name": "Alice Johnson",            // Anonymized
  "email": "alice.j@example.org",     // Anonymized
  "phone": "+1-555-987-6543",         // Anonymized
  "accountNumber": "ACC-789012",      // Anonymized
  "createdAt": "2025-07-16T10:30:45Z" // Preserved
}
````

## 📊 File Flow

### 1. Extraction Phase

```
Production MongoDB    → output/extracted/mongo/users_2025-07-16T10-30-45-123Z.json
Production PostgreSQL → output/extracted/pg/transactions_2025-07-16T10-30-45-123Z.csv
```

### 2. Transformation Phase

```
output/extracted/mongo/users_*.json        → output/transformed/mongo/users_*.transformed.json
output/extracted/pg/transactions_*.csv     → output/transformed/pg/transactions_*.transformed.csv
```

### 3. Load Phase

```
output/transformed/mongo/users_*.transformed.json     → QA MongoDB (users collection)
output/transformed/pg/transactions_*.transformed.csv  → QA PostgreSQL (transactions table)
```

## 🔄 API Endpoints

### Health Check

```bash
GET /health
```

### ETL Pipeline (Recommended)

```bash
# Run complete ETL pipeline
POST /etl/run

# Response
{
  "extract": { "totalRecords": 15000, "duration": 5000, "files": 5 },
  "transform": { "totalRecords": 15000, "duration": 8000, "files": 5 },
  "load": { "totalRecords": 15000, "duration": 3000, "collections": 3, "tables": 2 },
  "totalDuration": 16000,
  "success": true
}

# Get QA database statistics
GET /etl/stats

# Response
{
  "mongo": {
    "users": { "count": 1500, "size": 2048576 },
    "orders": { "count": 3000, "size": 5242880 }
  },
  "postgres": {
    "transactions": { "count": 10000, "size": "1.2 MB" },
    "customers": { "count": 2500, "size": "512 KB" }
  }
}
```

### Individual Modules

```bash
# Extract only
POST /extract/run

# Transform only
POST /transform/run

# Transform specific file
POST /transform/file
{
  "filePath": "output/extracted/mongo/users_2025-07-16T10-30-45-123Z.json"
}
```

## ⚡ Performance Features

### Memory Efficiency

-   **Streaming**: Large files processed without loading into memory
-   **Batching**: MongoDB (1K docs), PostgreSQL (5K rows) per batch
-   **Progress Logging**: Regular progress updates for large datasets

### Error Resilience

-   **Individual Failures**: Single file/table failures don't stop entire process
-   **Connection Handling**: Proper connection cleanup and error recovery
-   **Detailed Logging**: Comprehensive error reporting and progress tracking

### Parallel Processing

-   **Multiple Files**: Process multiple collections/tables concurrently
-   **Database Independence**: MongoDB and PostgreSQL processing runs in parallel

## 🛡️ Data Safety

### Production (Extract)

-   **Read-only**: No modifications to production data
-   **Connection Timeouts**: Configurable timeouts prevent hanging
-   **Selective Extraction**: Optional filtering by collection/table names

### QA (Load)

-   **Clean Slate**: Existing QA data cleared before loading new data
-   **Schema Recreation**: PostgreSQL tables recreated with fresh structure
-   **Referential Integrity**: IDs preserved for maintaining relationships

## 🔧 Development

### Project Structure

```
src/
├── modules/
│   ├── extract/         # Production data extraction
│   ├── transform/       # Data anonymization
│   ├── load/           # QA data loading
│   ├── etl-pipeline/   # Complete pipeline orchestration
│   └── health/         # Health checks
├── common/
│   ├── config/         # Environment validation
│   ├── global/         # Shared services
│   └── utils/          # Common utilities
└── main.ts            # Application entry point
```

### Key Dependencies

-   **NestJS**: Framework and dependency injection
-   **MongoDB**: `mongodb` driver for database operations
-   **PostgreSQL**: `pg` driver for database operations
-   **Data Processing**: `stream-json`, `csv-parser`, `fast-csv`
-   **Fake Data**: `@faker-js/faker` for realistic anonymization
-   **Validation**: `class-validator`, `class-transformer`

### Build & Run

```bash
# Install dependencies
pnpm install

# Development
pnpm start:dev

# Production build
pnpm build
pnpm start:prod

# Testing
pnpm test
```

## 🚨 Important Notes

### Security

-   **Credentials**: Store database credentials securely
-   **SSL/TLS**: Use SSL certificates for production PostgreSQL connections
-   **Network**: Ensure QA databases are accessible from ETL server
-   **Monitoring**: Monitor ETL process for sensitive data leaks

### SSL Configuration

When `NODE_ENV=production`, the `PG_SSL_CA` environment variable is required and must contain a base64-encoded SSL certificate authority (CA) certificate. This ensures secure connections to production and QA PostgreSQL databases.

To convert your CA certificate to base64:

```bash
# Linux/macOS
base64 -i ca-certificate.crt

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ca-certificate.crt"))
```

The decoded certificate will be used for both production and QA PostgreSQL connections when provided.

### Data Compliance

-   **Anonymization**: Verify anonymization meets compliance requirements
-   **Retention**: Consider data retention policies for extracted files
-   **Audit**: Maintain audit logs for data processing activities

### Performance

-   **Database Resources**: ETL process may impact database performance
-   **Disk Space**: Ensure sufficient disk space for temporary files
-   **Network**: Large datasets require adequate network bandwidth

This ETL server provides a robust, scalable solution for maintaining up-to-date, anonymized QA environments while ensuring data privacy and compliance.

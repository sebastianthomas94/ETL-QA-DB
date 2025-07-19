import { Injectable } from "@nestjs/common";
import { SaveHelper } from "@common/helpers/save.helper";
import { faker } from "@faker-js/faker";
import * as fsPromises from "fs/promises";
import * as path from "path";

@Injectable()
export class TransformService {
    constructor() {
        this.run()
            .then(() => {
                console.log("Transformation process completed.");
            })
            .catch((error) => {
                console.error("Error during transformation process:", error);
            });
    }

    async run(): Promise<void> {
        console.log("Starting data transformation process...");

        try {
            const [mongoData, postgresData] = await Promise.all([
                this.loadExtractedData("mongo"),
                this.loadExtractedData("pg"),
            ]);

            const transformedMongoData = this.transformData(mongoData, "mongo");
            const transformedPostgresData = this.transformData(postgresData, "pg");

            const saveHelper = new SaveHelper("transformed");
            await Promise.all([
                saveHelper.saveData(transformedMongoData, "mongo"),
                saveHelper.saveData(transformedPostgresData, "pg"),
            ]);

            console.log("Data transformation process completed successfully!");
        } catch (error) {
            console.error("Error during transformation process:", error);
            throw error;
        }
    }

    private async loadExtractedData(dbType: "mongo" | "pg"): Promise<Record<string, unknown>[]> {
        console.log(`Loading extracted ${dbType} data...`);

        const extractedDir = path.join(process.cwd(), "output", "extracted", dbType);
        const files = await fsPromises.readdir(extractedDir);
        const jsonFiles = files.filter((file) => file.endsWith(".json"));

        const data: Record<string, unknown>[] = [];

        for (const file of jsonFiles) {
            const filePath = path.join(extractedDir, file);
            const fileContent = await fsPromises.readFile(filePath, "utf8");
            const parsedData = JSON.parse(fileContent);
            data.push(parsedData);
        }

        console.log(`Loaded ${data.length} ${dbType} files`);
        return data;
    }

    private transformData(data: Record<string, unknown>[], dbType: "mongo" | "pg"): Record<string, unknown>[] {
        console.log(`Transforming ${data.length} ${dbType} collections/tables...`);

        return data.map((item) => {
            const transformedItem = { ...item };

            // Transform the actual data array
            if (Array.isArray(item.data)) {
                transformedItem.data = item.data.map((record: Record<string, unknown>) => this.transformRecord(record));
            } else if (Array.isArray(item.documents)) {
                // Handle MongoDB format
                transformedItem.documents = item.documents.map((record: Record<string, unknown>) =>
                    this.transformRecord(record),
                );
            }

            // Add transformation metadata
            transformedItem.transformedAt = new Date().toISOString();
            transformedItem.transformationType = "fake_data_generation";

            return transformedItem;
        });
    }

    private transformRecord(record: Record<string, unknown>): Record<string, unknown> {
        const transformedRecord = { ...record };

        // Transform sensitive fields with faker data
        for (const [key, value] of Object.entries(record)) {
            if (typeof value === "string" && value.length > 0) {
                transformedRecord[key] = this.transformStringField(key, value);
            }
            // Handle nested objects (like paymentDetails)
            else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                transformedRecord[key] = this.transformRecord(value as Record<string, unknown>);
            }
            // Handle arrays of objects
            else if (Array.isArray(value)) {
                transformedRecord[key] = value.map((item) =>
                    typeof item === "object" && item !== null
                        ? this.transformRecord(item as Record<string, unknown>)
                        : item,
                );
            }
        }

        return transformedRecord;
    }

    private transformStringField(key: string, value: string): string {
        const lowerKey = key.toLowerCase();

        // Name fields
        if (lowerKey.includes("name") && !lowerKey.includes("username") && !lowerKey.includes("filename")) {
            return faker.person.fullName();
        }
        // Phone/contact fields
        if (lowerKey.includes("phone") || lowerKey.includes("contact") || lowerKey.includes("mobile")) {
            return "+91" + faker.string.numeric(10);
        }
        // Email fields
        if (lowerKey.includes("email") || lowerKey.includes("mail")) {
            return faker.internet.email();
        }
        // Address fields
        if (lowerKey.includes("address")) {
            return faker.location.streetAddress();
        }
        // Account number fields
        if (lowerKey.includes("accountnumber") || lowerKey.includes("account_number")) {
            return faker.finance.accountNumber();
        }
        // IFSC code fields
        if (lowerKey.includes("ifsc")) {
            return faker.finance.routingNumber();
        }
        // Bank name fields
        if (lowerKey.includes("bankname") || lowerKey.includes("bank_name")) {
            return faker.company.name() + " Bank";
        }
        // UPI fields
        if (lowerKey.includes("upi")) {
            return faker.internet.displayName() + "@" + faker.helpers.arrayElement(["upi", "paytm", "phonepe", "gpay"]);
        }
        // Receipt/transaction IDs and ID fields (keep structure but randomize)
        if (
            lowerKey.includes("receipt") ||
            lowerKey.includes("transactionid") ||
            lowerKey.includes("paymentid") ||
            lowerKey === "id" ||
            lowerKey === "_id"
        ) {
            return faker.string.alphanumeric({ length: value.length });
        }

        // Return original value if no transformation needed
        return value;
    }
}

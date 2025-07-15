import * as fs from "fs/promises";
import * as path from "path";
import { ILoadFileInfo } from "../interfaces/load.interface";

/**
 * Get all JSON files in the transformed mongo directory
 */
export async function getTransformedMongoFiles(dirPath: string): Promise<ILoadFileInfo[]> {
    try {
        const files = await fs.readdir(dirPath);
        return files
            .filter((file) => file.endsWith(".json"))
            .map((file) => ({
                filePath: path.join(dirPath, file),
                fileName: file,
                source: "mongo" as const,
                collectionOrTableName: extractCollectionName(file),
            }));
    } catch {
        return [];
    }
}

/**
 * Get all CSV files in the transformed postgres directory
 */
export async function getTransformedCsvFiles(dirPath: string): Promise<ILoadFileInfo[]> {
    try {
        const files = await fs.readdir(dirPath);
        return files
            .filter((file) => file.endsWith(".csv"))
            .map((file) => ({
                filePath: path.join(dirPath, file),
                fileName: file,
                source: "postgres" as const,
                collectionOrTableName: extractTableName(file),
            }));
    } catch {
        return [];
    }
}

/**
 * Extract collection name from transformed JSON filename
 * Example: users_2025-07-16T10-30-45-123Z.transformed.json -> users
 */
function extractCollectionName(fileName: string): string {
    return fileName.replace(".transformed.json", "").replace(/_\d{4}-\d{2}-\d{2}T.*/, "");
}

/**
 * Extract table name from transformed CSV filename
 * Example: transactions_2025-07-16T10-30-45-123Z.transformed.csv -> transactions
 */
function extractTableName(fileName: string): string {
    return fileName.replace(".transformed.csv", "").replace(/_\d{4}-\d{2}-\d{2}T.*/, "");
}

/**
 * Read and parse JSON file
 */
export async function readJsonFile(filePath: string): Promise<unknown[]> {
    try {
        const content = await fs.readFile(filePath, "utf8");
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        throw new Error(`Failed to read JSON file ${filePath}: ${error}`);
    }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

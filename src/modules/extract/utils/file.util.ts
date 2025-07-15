import * as fs from "fs/promises";
import * as path from "path";

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Generate timestamped filename
 */
export function generateTimestampedFilename(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${baseName}_${timestamp}${extension}`;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCsv(data: Record<string, unknown>[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvHeader = headers.map((header) => `"${header}"`).join(",");

    const csvRows = data.map((row) =>
        headers
            .map((header) => {
                const value = row[header];
                if (value === null || value === undefined) return '""';
                const stringValue = String(value).replace(/"/g, '""');
                return `"${stringValue}"`;
            })
            .join(","),
    );

    return [csvHeader, ...csvRows].join("\n");
}

/**
 * Write data to file with proper error handling
 */
export async function writeDataToFile(filePath: string, data: string): Promise<void> {
    const dir = path.dirname(filePath);
    await ensureDirectoryExists(dir);
    await fs.writeFile(filePath, data, "utf8");
}

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
 * Get all files in a directory with specific extension
 */
export async function getFilesInDirectory(dirPath: string, extension: string): Promise<string[]> {
    try {
        const files = await fs.readdir(dirPath);
        return files.filter((file) => file.endsWith(extension)).map((file) => path.join(dirPath, file));
    } catch {
        return [];
    }
}

/**
 * Generate output filename for transformed file
 */
export function generateTransformedFilename(inputPath: string, suffix: string = ".transformed"): string {
    const parsed = path.parse(inputPath);
    const outputDir = inputPath.includes("extracted/mongo")
        ? inputPath.replace("extracted/mongo", "transformed/mongo")
        : inputPath.replace("extracted/pg", "transformed/pg");

    return outputDir.replace(parsed.base, `${parsed.name}${suffix}${parsed.ext}`);
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
    try {
        const stats = await fs.stat(filePath);
        return stats.size;
    } catch {
        return 0;
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

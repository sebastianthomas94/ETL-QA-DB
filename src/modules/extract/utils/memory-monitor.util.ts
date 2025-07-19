export class MemoryMonitor {
    private startTime: number;
    private lastMemoryCheck: number;

    constructor() {
        this.startTime = Date.now();
        this.lastMemoryCheck = Date.now();
    }

    logMemoryUsage(context: string): void {
        const memUsage = process.memoryUsage();
        const currentTime = Date.now();
        const elapsedTime = Math.round((currentTime - this.startTime) / 1000);
        const timeSinceLastCheck = Math.round((currentTime - this.lastMemoryCheck) / 1000);

        console.log(`[${context}] Memory Usage (${elapsedTime}s elapsed, +${timeSinceLastCheck}s):`);
        console.log(`  RSS: ${this.formatBytes(memUsage.rss)}`);
        console.log(`  Heap Used: ${this.formatBytes(memUsage.heapUsed)}`);
        console.log(`  Heap Total: ${this.formatBytes(memUsage.heapTotal)}`);
        console.log(`  External: ${this.formatBytes(memUsage.external)}`);

        this.lastMemoryCheck = currentTime;
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    getElapsedTime(): string {
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}m ${seconds}s`;
    }
}

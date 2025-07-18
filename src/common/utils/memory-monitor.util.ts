import { Logger } from "@nestjs/common";

export class MemoryMonitor {
    private static readonly logger = new Logger(MemoryMonitor.name);
    private static monitoringInterval: NodeJS.Timeout | null = null;

    static startMonitoring(intervalMs: number = 30000): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(() => {
            const memUsage = process.memoryUsage();
            const formatBytes = (bytes: number) => {
                return (bytes / 1024 / 1024).toFixed(2) + " MB";
            };

            this.logger.log(`Memory Usage:
                RSS: ${formatBytes(memUsage.rss)}
                Heap Used: ${formatBytes(memUsage.heapUsed)}
                Heap Total: ${formatBytes(memUsage.heapTotal)}
                External: ${formatBytes(memUsage.external)}
            `);

            // Warn if memory usage is high
            const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
            if (heapUsedMB > 2000) {
                this.logger.warn(`⚠️  High memory usage detected: ${formatBytes(memUsage.heapUsed)}`);

                // Force garbage collection if available
                if (global.gc) {
                    this.logger.log("🧹 Running garbage collection...");
                    global.gc();
                }
            }
        }, intervalMs);

        this.logger.log(`📊 Memory monitoring started (interval: ${intervalMs}ms)`);
    }

    static stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.log("📊 Memory monitoring stopped");
        }
    }

    static logCurrentUsage(): void {
        const memUsage = process.memoryUsage();
        const formatBytes = (bytes: number) => {
            return (bytes / 1024 / 1024).toFixed(2) + " MB";
        };

        this.logger.log(`📊 Current Memory Usage:
            RSS: ${formatBytes(memUsage.rss)}
            Heap Used: ${formatBytes(memUsage.heapUsed)}
            Heap Total: ${formatBytes(memUsage.heapTotal)}
            External: ${formatBytes(memUsage.external)}
        `);
    }

    static forceGarbageCollection(): void {
        if (global.gc) {
            this.logger.log("🧹 Forcing garbage collection...");
            const beforeMem = process.memoryUsage();
            global.gc();
            const afterMem = process.memoryUsage();

            const beforeMB = beforeMem.heapUsed / 1024 / 1024;
            const afterMB = afterMem.heapUsed / 1024 / 1024;
            const freedMB = beforeMB - afterMB;

            this.logger.log(`🧹 GC completed. Freed ${freedMB.toFixed(2)} MB`);
        } else {
            this.logger.warn("⚠️  Garbage collection not available. Run with --expose-gc flag.");
        }
    }
}

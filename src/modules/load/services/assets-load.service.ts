import { Injectable, Logger } from "@nestjs/common";
import { S3Client, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { EnvironmentService } from "../../../common/global/environment.service";
import { IS3Config } from "../interfaces/assets.interface";

@Injectable()
export class AssetsLoadService {
    private readonly logger = new Logger(AssetsLoadService.name);
    private readonly prodS3: S3Client;
    private readonly qaS3: S3Client;

    constructor(private readonly environmentService: EnvironmentService) {
        this.prodS3 = this.createS3Client(this.environmentService.productionR2);
        this.qaS3 = this.createS3Client(this.environmentService.qaR2);
    }

    private createS3Client(config: IS3Config): S3Client {
        return new S3Client({
            region: config.region,
            endpoint: config.endpoint,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            forcePathStyle: true,
        });
    }

    private async assetExistsInQA(key: string): Promise<boolean> {
        try {
            await this.qaS3.send(
                new HeadObjectCommand({
                    Bucket: this.environmentService.qaR2BucketName,
                    Key: key,
                }),
            );
            return true;
        } catch {
            return false;
        }
    }

    private async copyAssetToQA(key: string): Promise<void> {
        const prodBucket = this.environmentService.productionR2BucketName;
        const qaBucket = this.environmentService.qaR2BucketName;

        await this.qaS3.send(
            new CopyObjectCommand({
                Bucket: qaBucket,
                Key: key,
                CopySource: `${prodBucket}/${key}`,
            }),
        );
    }

    async migrateAssets(): Promise<void> {
        this.logger.log("Starting asset migration...");

        const prodBucket = this.environmentService.productionR2BucketName;
        let continuationToken: string | undefined;
        let migratedCount = 0;
        let skippedCount = 0;

        do {
            const response = await this.prodS3.send(
                new ListObjectsV2Command({
                    Bucket: prodBucket,
                    ContinuationToken: continuationToken,
                    MaxKeys: 1000,
                }),
            );

            if (response.Contents) {
                for (const object of response.Contents) {
                    if (!object.Key) continue;

                    const isAssetInQA = await this.assetExistsInQA(object.Key);

                    if (!isAssetInQA) {
                        await this.copyAssetToQA(object.Key);
                        migratedCount++;
                        this.logger.debug(`Migrated: ${object.Key}`);
                    } else {
                        skippedCount++;
                    }
                }
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        this.logger.log(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
    }
}

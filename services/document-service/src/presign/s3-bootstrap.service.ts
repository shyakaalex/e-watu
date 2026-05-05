import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';

/**
 * Ensures the configured bucket exists (replaces a separate `minio/mc` init container
 * that often fails to pull on flaky Docker Hub / CDN).
 */
@Injectable()
export class S3BootstrapService implements OnModuleInit {
  private readonly log = new Logger(S3BootstrapService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.config.getOrThrow<string>('S3_ENDPOINT');
    const region = this.config.get('S3_REGION', 'us-east-1');
    const accessKeyId = this.config.getOrThrow<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.config.getOrThrow<string>('S3_SECRET_KEY');
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');

    const client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.log.log(`S3 bucket "${bucket}" already exists`);
      return;
    } catch (e: unknown) {
      const code = (e as { name?: string; $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      const notFound =
        code === 404 ||
        (e as { name?: string })?.name === 'NotFound';
      if (!notFound) {
        this.log.error(
          `Could not check bucket "${bucket}": ${e instanceof Error ? e.message : e}`,
        );
        throw e;
      }
    }

    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      this.log.log(`Created S3 bucket "${bucket}"`);
    } catch (e: unknown) {
      this.log.error(
        `Failed to create bucket "${bucket}": ${e instanceof Error ? e.message : e}`,
      );
      throw e;
    }
  }
}

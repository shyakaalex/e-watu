import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EwatuRole, type AuthUser } from '@ewatu/common-auth';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignUploadDto } from './dto/presign-upload.dto';

@Injectable()
export class PresignService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    const endpoint = config.getOrThrow<string>('S3_ENDPOINT');
    const region = config.get('S3_REGION', 'us-east-1');
    const accessKeyId = config.getOrThrow<string>('S3_ACCESS_KEY');
    const secretAccessKey = config.getOrThrow<string>('S3_SECRET_KEY');
    this.bucket = config.getOrThrow<string>('S3_BUCKET');
    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  private assertCanPresignForTenant(user: AuthUser, tenantId: string) {
    if (user.roles.includes(EwatuRole.PLATFORM_SUPER_ADMIN)) return;
    if (user.roles.includes(EwatuRole.TENANT_ADMIN) && user.tenant_id === tenantId) {
      return;
    }
    throw new ForbiddenException(
      'You need PLATFORM_SUPER_ADMIN, or TENANT_ADMIN for this tenant (tenant_id in token must match).',
    );
  }

  async createPresignedPut(user: AuthUser, dto: PresignUploadDto) {
    this.assertCanPresignForTenant(user, dto.tenantId);

    const key = `tenants/${dto.tenantId}/${dto.objectKey}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    const expires = 3600;
    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(this.client, command, { expiresIn: expires });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new ServiceUnavailableException(`Storage error: ${msg}`);
    }

    return {
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': dto.contentType },
      key,
      bucket: this.bucket,
      expiresInSeconds: expires,
    };
  }
}

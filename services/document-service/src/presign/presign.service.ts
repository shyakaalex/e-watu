import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EwatuRole, type AuthUser } from '@ewatu/common-auth';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignUploadDto } from './dto/presign-upload.dto';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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

  private resolveTenantId(user: AuthUser): string {
    const tenantId = user.tenant_id?.trim();
    if (!tenantId) {
      throw new ForbiddenException(
        'Presign requires a tenant-scoped account (tenant_id must be present in your access token).',
      );
    }
    if (
      !user.roles.includes(EwatuRole.TENANT_ADMIN) &&
      !user.roles.includes(EwatuRole.PLATFORM_SUPER_ADMIN)
    ) {
      throw new ForbiddenException(
        'You need PLATFORM_SUPER_ADMIN or TENANT_ADMIN to upload files.',
      );
    }
    return tenantId;
  }

  async createPresignedPut(user: AuthUser, dto: PresignUploadDto) {
    if (!ALLOWED_MIME_TYPES.includes(dto.contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (dto.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        'File size exceeds maximum allowed size of 10MB',
      );
    }

    const tenantId = this.resolveTenantId(user);
    const key = `tenants/${tenantId}/${dto.objectKey}`;

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

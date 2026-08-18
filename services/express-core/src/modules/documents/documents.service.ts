import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configure S3 client (supports MinIO local setup via env S3_ENDPOINT)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'ewatu',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'ewatu_dev_minio',
  },
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:19000',
  forcePathStyle: true, // required for local MinIO/mock setups
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'ewatu-documents';

/**
 * Generate a presigned S3 upload URL scoped under tenants/{tenant_id}/documents/
 */
export async function generateUploadPresignedUrl(
  tenantId: string,
  fileName: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; fileKey: string }> {
  // Scoped path to ensure tenant isolation at the file storage level
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `tenants/${tenantId}/documents/${Date.now()}_${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    fileKey,
  };
}

/**
 * Generate a presigned S3 download URL.
 * Strictly checks that the requested fileKey resides under the tenant's namespace.
 */
export async function generateDownloadPresignedUrl(
  tenantId: string,
  fileKey: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  // Security Guard: Prevent tenant boundary escape
  const tenantPrefix = `tenants/${tenantId}/`;
  if (!fileKey.startsWith(tenantPrefix)) {
    throw new Error('Access Denied: Requested file does not belong to this tenant.');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Template Rendering Engine
 * Replaces placeholders in templates with merge field values.
 * Example template: "Dear {employee_name}, your salary is {salary} RWF."
 */
export function renderDocumentTemplate(
  templateText: string,
  mergeFields: Record<string, string | number>
): string {
  return templateText.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (mergeFields[key] !== undefined) {
      return String(mergeFields[key]);
    }
    return match; // Leave original placeholder if no value is mapped
  });
}

# Document Service

## What this service does

Generates tenant-scoped presigned S3/MinIO upload URLs with MIME and size validation.

## Port

Runs on port: **3018**

## Running locally

```bash
cd services/document-service
npm install
npm run start:dev
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| JWT_PUBLIC_KEY | Yes | RS256 public PEM |
| JWT_ISSUER | Yes | Token issuer |
| S3_ENDPOINT | Yes | MinIO/S3 URL |
| S3_BUCKET | Yes | Bucket name |
| S3_ACCESS_KEY | Yes | Access key |
| S3_SECRET_KEY | Yes | Secret key |
| CORS_ORIGIN | Yes | Allowed origins |

## API endpoints

- `POST /api/v1/document/presign` (JWT, body: tenantId, objectKey, contentType, fileSize)
- `GET /api/v1/document/health`

## Running tests

```bash
npm test
```

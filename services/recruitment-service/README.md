# Recruitment Service

## What this service does

Jobs, candidates, applications, interviews, and the public careers portal (`/api/v1/public/:slug/...`).

## Port

Runs on port: **3013**

## Prerequisites

- Node.js v20+, PostgreSQL, platform-service running for public tenant resolution

## Running locally

```bash
cd services/recruitment-service
npm install
npx prisma migrate deploy
npm run start:dev
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL |
| JWT_PUBLIC_KEY | Yes | RS256 public PEM |
| JWT_ISSUER | Yes | Token issuer |
| PLATFORM_SERVICE_URL | Yes | Platform internal API |
| INTERNAL_API_KEY | Yes | Shared secret |
| CORS_ORIGIN | Yes | Allowed origins |

## API endpoints

- `GET/POST/PATCH/DELETE /api/v1/jobs` (RBAC)
- `GET/POST/PATCH /api/v1/candidates`
- `GET/POST/PATCH /api/v1/applications`
- `GET/POST/PATCH /api/v1/interviews`
- `GET /api/v1/public/:slug/jobs`, apply, talent-pool
- `GET /api/v1/recruitment/health`

## Running tests

```bash
npm test
```

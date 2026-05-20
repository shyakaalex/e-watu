# Platform Service

## What this service does

Tenant registry and onboarding: company registration, approve/reject workflow, tenant settings, public careers metadata, and internal callbacks from identity.

## Port

Runs on port: **3012**

## Prerequisites

- Node.js v20+
- PostgreSQL
- Copy `env.example` to `.env`

## Running locally

```bash
cd services/platform-service
npm install
npx prisma migrate deploy
npm run start:dev
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL |
| JWT_PUBLIC_KEY | Yes | RS256 public PEM (verify JWT) |
| JWT_ISSUER | Yes | Must match identity-service |
| INTERNAL_API_KEY | Yes | Shared with identity/recruitment/notification |
| IDENTITY_SERVICE_URL | Yes | Identity base URL |
| NOTIFICATION_SERVICE_URL | Yes | Notification base URL |
| WEB_APP_ORIGIN | Yes | Frontend URL for email links |
| CORS_ORIGIN | Yes | Allowed origins |

## API endpoints

- `POST /api/v1/onboarding/register`
- `GET/PATCH /api/v1/tenants/*` (super admin)
- `GET/PATCH /api/v1/my/tenant/*`
- `GET /api/v1/public/tenants/:slug`
- `PATCH /api/v1/internal/tenants/:id/email-verified`
- `GET /api/v1/platform/health`

## Running tests

```bash
npm test
```

# Identity Service

## What this service does

Handles authentication and user accounts for E-Watu: login, refresh tokens, email verification, tenant-owner provisioning (internal), and tenant-scoped user management.

## Port

Runs on port: **3011**

## Prerequisites

- Node.js v20+
- PostgreSQL (via Docker Compose)
- Copy `env.example` to `.env` and fill in values
- Generate RS256 keys (see `env.example`)

## Running locally

```bash
cd services/identity-service
npm install
npx prisma migrate deploy
npm run start:dev
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_PRIVATE_KEY | Yes | RS256 private PEM (signing only) |
| JWT_PUBLIC_KEY | Yes | RS256 public PEM |
| JWT_ISSUER | Yes | Token issuer URL |
| JWT_EXPIRES_IN | No | Access token TTL (default 15m) |
| CORS_ORIGIN | Yes | Allowed browser origins |
| INTERNAL_API_KEY | Yes | Shared secret for internal APIs |
| PLATFORM_SERVICE_URL | Yes | Platform base URL |
| SERVICE_NAME | No | Log label (identity-service) |

## API endpoints

- `POST /api/v1/auth/login` — login (rate limited)
- `POST /api/v1/auth/refresh` — rotate refresh token
- `POST /api/v1/auth/logout` — revoke refresh token (JWT required)
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/internal/provision-tenant-owner`
- `GET /api/v1/me`
- `GET/POST/PATCH /api/v1/users`
- `GET /api/v1/identity/health`

## Running tests

```bash
npm test
```
# Mon Jun  8 22:11:21 CAT 2026

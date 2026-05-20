# Notification Service

## What this service does

SMTP email (verify, approve, reject templates) and in-app notifications. Internal `dispatch` is processed asynchronously.

## Port

Runs on port: **3015**

## Running locally

```bash
cd services/notification-service
npm install
npx prisma migrate deploy
npm run start:dev
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL |
| JWT_PUBLIC_KEY | Yes | RS256 public PEM |
| INTERNAL_API_KEY | Yes | Internal dispatch auth |
| SMTP_HOST | No | If empty, emails log to console |
| EMAIL_FROM | Yes | Sender address |

## API endpoints

- `POST /api/v1/internal/dispatch`
- `GET /api/v1/notifications` (JWT)
- `PATCH /api/v1/notifications/:id/read`
- `GET /api/v1/notifications/health`

## Running tests

```bash
npm test
```

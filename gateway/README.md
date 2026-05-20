# E-Watu API Gateway

Nginx reverse proxy that exposes a **single HTTP entry point** (port 80) for all backend microservices.

## Routes

| Path prefix | Service | Port (container) |
|-------------|---------|------------------|
| `/api/v1/auth`, `/me`, `/users`, `/identity` | identity-service | 3011 |
| `/api/v1/platform`, `/tenants`, `/onboarding`, `/my`, `/public/tenants` | platform-service | 3012 |
| `/api/v1/jobs`, `/candidates`, `/applications`, `/interviews`, `/offers`, `/placements`, `/public/` | recruitment-service | 3013 |
| `/api/v1/document` | document-service | 3018 |
| `/api/v1/notifications` | notification-service | 3015 |
| `/health` | gateway health | — |

## Local dev without Docker

Run services with `npm run dev:all` and point the frontend at direct ports, **or** run `docker compose up` for the full stack including this gateway.

Set `VITE_API_URL=http://localhost` in `web/.env` when using the gateway.

## Production (Coolify)

Use `docker-compose.coolify.yml` and `gateway/Dockerfile.prod` (SPA + API on port 80). See [docs/COOLIFY.md](../docs/COOLIFY.md).

## Adding a new service route

1. Add an `upstream` block in `nginx.conf` using the Docker Compose service name and port.
2. Add a `location` block for the API path prefix.
3. Add the service to `docker-compose.yml` under `gateway.depends_on`.
4. Document the path in this README.

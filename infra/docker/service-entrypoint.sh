#!/bin/sh
# Install OpenSSL if not present (required by Prisma)
apk add --no-cache openssl libssl3 2>/dev/null || true

set -e

echo "Starting E-Watu service: ${SERVICE_NAME:-service}"

# Run Prisma migrations if schema exists
if [ -f "./prisma/schema.prisma" ]; then
  echo "Running database migrations for ${SERVICE_NAME:-service}..."
  npx prisma migrate deploy --schema=./prisma/schema.prisma
  echo "Migrations complete."
fi

# Execute the main process
exec "$@"

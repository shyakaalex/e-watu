#!/bin/sh
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

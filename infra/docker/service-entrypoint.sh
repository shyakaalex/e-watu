#!/bin/sh
set -e
if [ -f ./prisma/schema.prisma ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "[${SERVICE_NAME:-service}] prisma migrate deploy..."
  npx prisma migrate deploy
fi
exec "$@"

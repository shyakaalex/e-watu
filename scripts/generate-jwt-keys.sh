#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/infra/dev-jwt"
mkdir -p "$OUT"
openssl genrsa -out "$OUT/private.pem" 2048
openssl rsa -in "$OUT/private.pem" -pubout -out "$OUT/public.pem"
echo "Keys written to infra/dev-jwt/"
echo "Run: node scripts/pem-to-env-line.mjs private | pbcopy  # identity JWT_PRIVATE_KEY"
echo "Run: node scripts/pem-to-env-line.mjs public  | pbcopy  # all services JWT_PUBLIC_KEY"

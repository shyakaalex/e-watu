# Build context: repo root (/)
# NOTE: NODE_ENV is runtime-only. Do not pass as build ARG.
# Build stage always installs devDependencies for TypeScript compilation.
FROM node:20-alpine AS build
RUN apk add --no-cache openssl libssl3
WORKDIR /repo

# Build shared library
COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth --include=dev && \
    npm run build --prefix libs/common-auth

# Build service
COPY services/platform-service ./services/platform-service
WORKDIR /repo/services/platform-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

# Remove devDependencies after build
RUN npm prune --omit=dev

# ── Production stage ─────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache openssl libssl3
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=platform-service

COPY --from=build /repo/libs/common-auth /libs/common-auth
COPY --from=build /repo/services/platform-service/node_modules ./node_modules
COPY --from=build /repo/services/platform-service/dist ./dist
COPY --from=build /repo/services/platform-service/prisma ./prisma
COPY --from=build /repo/services/platform-service/node_modules/.prisma \
     ./node_modules/.prisma
COPY --from=build /repo/services/platform-service/node_modules/@prisma \
     ./node_modules/@prisma
COPY --from=build /repo/services/platform-service/node_modules/prisma \
     ./node_modules/prisma
COPY --from=build /repo/services/platform-service/package.json ./package.json

COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3012
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

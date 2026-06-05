# Build context: repo root (/)
# NOTE: NODE_ENV is runtime-only. Do not pass as build ARG.
# Build stage always installs devDependencies for TypeScript compilation.
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /repo

# Build shared library
COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth --include=dev && \
    npm run build --prefix libs/common-auth

# Build service
COPY services/recruitment-service ./services/recruitment-service
WORKDIR /repo/services/recruitment-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

# Remove devDependencies after build
RUN npm prune --omit=dev

# ── Production stage ─────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=recruitment-service

COPY --from=build /repo/libs/common-auth /libs/common-auth
COPY --from=build /repo/services/recruitment-service/node_modules ./node_modules
COPY --from=build /repo/services/recruitment-service/dist ./dist
COPY --from=build /repo/services/recruitment-service/prisma ./prisma
COPY --from=build /repo/services/recruitment-service/node_modules/.prisma \
     ./node_modules/.prisma
COPY --from=build /repo/services/recruitment-service/node_modules/@prisma \
     ./node_modules/@prisma
COPY --from=build /repo/services/recruitment-service/node_modules/prisma \
     ./node_modules/prisma
COPY --from=build /repo/services/recruitment-service/package.json ./package.json

COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3013
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

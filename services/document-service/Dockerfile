# Build context: repo root (/) — no Prisma
# NOTE: NODE_ENV is runtime-only. Do not pass as build ARG.
# Build stage always installs devDependencies for TypeScript compilation.
FROM node:20-alpine AS build
WORKDIR /repo

COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth --include=dev && \
    npm run build --prefix libs/common-auth

COPY services/document-service ./services/document-service
WORKDIR /repo/services/document-service
RUN npm ci --include=dev && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=document-service

COPY --from=build /repo/services/document-service/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /repo/services/document-service/dist ./dist

COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3018
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

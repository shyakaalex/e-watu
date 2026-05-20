# Build context: repo root (/)
# NOTE: NODE_ENV is runtime-only. Do not pass as build ARG.
# Build stage always installs devDependencies for TypeScript compilation.
FROM node:20-alpine AS build
WORKDIR /repo

COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth --include=dev && \
    npm run build --prefix libs/common-auth

COPY services/recruitment-service ./services/recruitment-service
WORKDIR /repo/services/recruitment-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=recruitment-service

COPY --from=build /repo/services/recruitment-service/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /repo/services/recruitment-service/dist ./dist
COPY --from=build /repo/services/recruitment-service/prisma ./prisma
COPY --from=build /repo/services/recruitment-service/node_modules/.prisma \
     ./node_modules/.prisma
COPY --from=build /repo/services/recruitment-service/node_modules/@prisma \
     ./node_modules/@prisma
COPY --from=build /repo/services/recruitment-service/node_modules/prisma \
     ./node_modules/prisma

COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3013
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

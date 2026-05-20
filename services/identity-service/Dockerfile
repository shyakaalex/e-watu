# Build context: repo root (/)
# NOTE: NODE_ENV is runtime-only. Do not pass as build ARG.
# Build stage always installs devDependencies for TypeScript compilation.
FROM node:20-alpine AS build
WORKDIR /repo

COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth --include=dev && \
    npm run build --prefix libs/common-auth

COPY services/identity-service ./services/identity-service
WORKDIR /repo/services/identity-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=identity-service

COPY --from=build /repo/services/identity-service/package.json ./package.json
COPY --from=build /repo/services/identity-service/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

COPY --from=build /repo/services/identity-service/dist ./dist
COPY --from=build /repo/services/identity-service/prisma ./prisma
COPY --from=build /repo/services/identity-service/node_modules/.prisma \
     ./node_modules/.prisma
COPY --from=build /repo/services/identity-service/node_modules/@prisma \
     ./node_modules/@prisma
COPY --from=build /repo/services/identity-service/node_modules/prisma \
     ./node_modules/prisma

COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3011
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

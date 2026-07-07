FROM node:20-alpine AS build
RUN apk add --no-cache openssl libssl3
WORKDIR /repo

COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth --include=dev && \
    npm run build --prefix libs/common-auth

COPY services/talent-pool-service ./services/talent-pool-service
WORKDIR /repo/services/talent-pool-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

RUN npm prune --omit=dev

FROM node:20-alpine
RUN apk add --no-cache openssl libssl3
WORKDIR /app
RUN apk add --no-cache openssl libssl3
ENV NODE_ENV=production
ENV SERVICE_NAME=talent-pool-service

COPY --from=build /repo/libs/common-auth /libs/common-auth
COPY --from=build /repo/services/talent-pool-service/node_modules ./node_modules
COPY --from=build /repo/services/talent-pool-service/dist ./dist
COPY --from=build /repo/services/talent-pool-service/prisma ./prisma
COPY --from=build /repo/services/talent-pool-service/node_modules/.prisma \
     ./node_modules/.prisma
COPY --from=build /repo/services/talent-pool-service/node_modules/@prisma \
     ./node_modules/@prisma
COPY --from=build /repo/services/talent-pool-service/node_modules/prisma \
     ./node_modules/prisma
COPY --from=build /repo/services/talent-pool-service/package.json ./package.json

COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3014
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

FROM node:20-alpine AS build
WORKDIR /repo
COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth && npm run build --prefix libs/common-auth
COPY services/platform-service ./services/platform-service
WORKDIR /repo/services/platform-service
RUN npm ci && npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production SERVICE_NAME=platform-service
COPY --from=build /repo/services/platform-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /repo/services/platform-service/dist ./dist
COPY --from=build /repo/services/platform-service/prisma ./prisma
COPY --from=build /repo/services/platform-service/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /repo/services/platform-service/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /repo/services/platform-service/node_modules/prisma ./node_modules/prisma
COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3012
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

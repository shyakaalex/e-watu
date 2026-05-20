FROM node:20-alpine AS build
WORKDIR /repo
COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth && npm run build --prefix libs/common-auth
COPY services/notification-service ./services/notification-service
WORKDIR /repo/services/notification-service
RUN npm ci && npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production SERVICE_NAME=notification-service
COPY --from=build /repo/services/notification-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /repo/services/notification-service/dist ./dist
COPY --from=build /repo/services/notification-service/prisma ./prisma
COPY --from=build /repo/services/notification-service/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /repo/services/notification-service/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /repo/services/notification-service/node_modules/prisma ./node_modules/prisma
COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3015
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

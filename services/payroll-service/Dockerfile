FROM node:20-alpine AS build
WORKDIR /repo

COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth --include=dev && \
    npm run build --prefix libs/common-auth

COPY services/payroll-service ./services/payroll-service
WORKDIR /repo/services/payroll-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=payroll-service

COPY --from=build /repo/libs/common-auth /libs/common-auth
COPY --from=build /repo/services/payroll-service/node_modules ./node_modules
COPY --from=build /repo/services/payroll-service/dist ./dist
COPY --from=build /repo/services/payroll-service/prisma ./prisma
COPY --from=build /repo/services/payroll-service/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /repo/services/payroll-service/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /repo/services/payroll-service/node_modules/prisma ./node_modules/prisma
COPY --from=build /repo/services/payroll-service/package.json ./package.json

COPY infra/docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3016
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

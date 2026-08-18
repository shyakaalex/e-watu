# Build arg SERVICE_DIR e.g. services/platform-service
FROM node:20-alpine AS build
ARG SERVICE_DIR
WORKDIR /app
COPY ${SERVICE_DIR}/package*.json ./
COPY ${SERVICE_DIR}/prisma ./prisma/
RUN npm ci
COPY ${SERVICE_DIR}/ ./
COPY libs/common-auth /libs/common-auth
RUN npm ci --prefix /libs/common-auth && npm run build --prefix /libs/common-auth
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi
RUN npm run build

FROM node:20-alpine
ARG SERVICE_PORT=3000
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma/
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true
EXPOSE ${SERVICE_PORT}
CMD ["node", "dist/main.js"]

FROM node:20-alpine AS build
WORKDIR /repo
COPY libs/common-auth ./libs/common-auth
RUN npm ci --prefix libs/common-auth && npm run build --prefix libs/common-auth
COPY services/document-service ./services/document-service
WORKDIR /repo/services/document-service
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production SERVICE_NAME=document-service
COPY --from=build /repo/services/document-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /repo/services/document-service/dist ./dist
EXPOSE 3018
CMD ["node", "dist/main.js"]

# Build context: repo root (/)
# NOTE: Coolify may inject NODE_ENV=production as a build ARG.
# Build stage always forces development so TypeScript/devDeps install correctly.
FROM node:20-alpine AS build
RUN apk add --no-cache openssl libssl3
WORKDIR /repo
ENV NODE_ENV=development

# Root package.json required for service file:../.. (ewatu-erp) dependency
COPY package.json ./

# Build shared library (call tsc directly — avoid npx path bugs)
COPY libs/common-auth ./libs/common-auth
RUN cd /repo/libs/common-auth && \
    npm ci --include=dev && \
    node ./node_modules/typescript/bin/tsc -p tsconfig.json

# Build service
COPY services/recruitment-service ./services/recruitment-service
WORKDIR /repo/services/recruitment-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

RUN npm prune --omit=dev

# ── Production stage ─────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache openssl libssl3
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=recruitment-service

COPY --from=build /repo/libs/common-auth /libs/common-auth
COPY --from=build /repo/services/recruitment-service/node_modules ./node_modules
COPY --from=build /repo/services/recruitment-service/dist ./dist
COPY --from=build /repo/services/recruitment-service/prisma ./prisma
COPY --from=build /repo/services/recruitment-service/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /repo/services/recruitment-service/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /repo/services/recruitment-service/node_modules/prisma ./node_modules/prisma
COPY --from=build /repo/services/recruitment-service/package.json ./package.json

COPY docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3013
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

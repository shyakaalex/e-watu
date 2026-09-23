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
COPY services/identity-service ./services/identity-service
WORKDIR /repo/services/identity-service
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

RUN npm prune --omit=dev

# ── Production stage ─────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache openssl libssl3
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=identity-service

COPY --from=build /repo/libs/common-auth /libs/common-auth
COPY --from=build /repo/services/identity-service/node_modules ./node_modules
COPY --from=build /repo/services/identity-service/dist ./dist
COPY --from=build /repo/services/identity-service/prisma ./prisma
COPY --from=build /repo/services/identity-service/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /repo/services/identity-service/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /repo/services/identity-service/node_modules/prisma ./node_modules/prisma
COPY --from=build /repo/services/identity-service/package.json ./package.json

COPY docker/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3011
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]

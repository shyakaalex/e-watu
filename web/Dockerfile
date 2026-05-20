# Production frontend — build context: repo root (/)
# Coolify: dockerfile web/Dockerfile, port 80
FROM node:20-alpine AS build
WORKDIR /app

COPY web/package*.json ./
RUN npm ci

COPY web/ ./

# Override per environment in Coolify build args (no trailing /api — app adds /api/v1)
ARG VITE_API_URL=https://staging.hcsolutions.site
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

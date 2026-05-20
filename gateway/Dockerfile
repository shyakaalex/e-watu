# API gateway — build context: repo root (/)
# Coolify: dockerfile gateway/Dockerfile, port 80
FROM nginx:alpine
RUN apk add --no-cache gettext curl
COPY gateway/nginx.conf.template /etc/nginx/nginx.conf.template
COPY gateway/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1
ENTRYPOINT ["/entrypoint.sh"]

#!/bin/sh
set -e

export IDENTITY_SERVICE_URL="${IDENTITY_SERVICE_URL:-identity-service:3011}"
export PLATFORM_SERVICE_URL="${PLATFORM_SERVICE_URL:-platform-service:3012}"
export RECRUITMENT_SERVICE_URL="${RECRUITMENT_SERVICE_URL:-recruitment-service:3013}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL:-notification-service:3015}"
export DOCUMENT_SERVICE_URL="${DOCUMENT_SERVICE_URL:-document-service:3018}"

envsubst '${IDENTITY_SERVICE_URL} ${PLATFORM_SERVICE_URL} ${RECRUITMENT_SERVICE_URL} ${NOTIFICATION_SERVICE_URL} ${DOCUMENT_SERVICE_URL}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

exec nginx -g "daemon off;"

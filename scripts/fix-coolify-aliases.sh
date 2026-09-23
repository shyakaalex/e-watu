#!/usr/bin/env bash
# Restore Docker network aliases for E-Watu Coolify apps after a redeploy.
# Run on the Coolify host as root (or a user in the docker group).
#
# Usage:
#   ./scripts/fix-coolify-aliases.sh
#   NETWORK_ID=19d454d... ./scripts/fix-coolify-aliases.sh
#   ./scripts/fix-coolify-aliases.sh --list   # print running containers to fill UUID map
#
# Discover Coolify resource UUIDs:
#   docker ps --format '{{.Names}}\t{{.Image}}\t{{.ID}}'
# Coolify container names usually start with the resource UUID.

set -euo pipefail

NETWORK_ID="${NETWORK_ID:-19d454d29fa3bb02f01092420262c6ce4d27d829dfb733515b6a212b96541a81}"

# Coolify resource UUID prefix → DNS alias nginx expects
# Update these after: docker ps --format '{{.Names}}\t{{.Image}}'
declare -A UUID_TO_ALIAS=(
  [g8y94697174pnq5y74kuk8g7]=identity-service
  # Add remaining apps once known, e.g.:
  # [xxxxxxxxxxxxxxxxxxxxxxxx]=platform-service
  # [xxxxxxxxxxxxxxxxxxxxxxxx]=recruitment-service
  # [xxxxxxxxxxxxxxxxxxxxxxxx]=talent-pool-service
  # [xxxxxxxxxxxxxxxxxxxxxxxx]=notification-service
  # [xxxxxxxxxxxxxxxxxxxxxxxx]=payroll-service
  # [xxxxxxxxxxxxxxxxxxxxxxxx]=document-service
  # [foxvyku0dimv89c61t2l61uf]=gateway   # optional; gateway does not need an alias for itself
)

list_containers() {
  echo "Running containers (Names / Image / ID):"
  docker ps --format '{{.Names}}\t{{.Image}}\t{{.ID}}'
  echo
  echo "Fill UUID_TO_ALIAS in this script with the Coolify resource UUID prefix from Names."
}

find_container() {
  local uuid_prefix="$1"
  # Prefer exact name prefix match (Coolify uses <uuid> or <uuid>-<hash>)
  local name
  name="$(docker ps --format '{{.Names}}' | grep -E "^${uuid_prefix}" | head -n1 || true)"
  if [[ -n "$name" ]]; then
    echo "$name"
    return 0
  fi
  return 1
}

apply_alias() {
  local uuid_prefix="$1"
  local alias_name="$2"
  local container
  if ! container="$(find_container "$uuid_prefix")"; then
    echo "WARN: no running container for UUID prefix ${uuid_prefix} (alias ${alias_name}) — skip"
    return 0
  fi

  echo "→ ${container}  alias=${alias_name}  network=${NETWORK_ID:0:12}…"

  # Disconnect if already attached (ignore errors), then reconnect with alias.
  docker network disconnect "$NETWORK_ID" "$container" 2>/dev/null || true
  if ! docker network connect --alias "$alias_name" "$NETWORK_ID" "$container"; then
    echo "ERROR: failed to connect ${container} with alias ${alias_name}"
    return 1
  fi
  echo "OK  ${alias_name} → ${container}"
}

if [[ "${1:-}" == "--list" ]]; then
  list_containers
  exit 0
fi

if ! docker network inspect "$NETWORK_ID" >/dev/null 2>&1; then
  echo "ERROR: Docker network ${NETWORK_ID} not found."
  echo "List networks: docker network ls"
  exit 1
fi

if [[ ${#UUID_TO_ALIAS[@]} -eq 0 ]]; then
  echo "ERROR: UUID_TO_ALIAS is empty. Run with --list and fill the map."
  exit 1
fi

echo "Fixing Coolify aliases on network ${NETWORK_ID}"
failed=0
for uuid in "${!UUID_TO_ALIAS[@]}"; do
  apply_alias "$uuid" "${UUID_TO_ALIAS[$uuid]}" || failed=1
done

echo
echo "Verify from gateway container:"
echo "  docker exec <gateway-container> wget -qO- http://identity-service:3011/api/v1/identity/health"
echo "  docker exec <gateway-container> nslookup identity-service"

exit "$failed"

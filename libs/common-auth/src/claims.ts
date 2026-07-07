import type { AuthUser } from './auth-user';

function collectRoles(payload: Record<string, unknown>): string[] {
  const direct = payload.roles;
  if (Array.isArray(direct)) {
    return direct.filter((r): r is string => typeof r === 'string');
  }

  const set = new Set<string>();
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  realmAccess?.roles?.forEach((r) => set.add(r));
  const resourceAccess = payload.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined;
  if (resourceAccess) {
    for (const c of Object.values(resourceAccess)) {
      c.roles?.forEach((r) => set.add(r));
    }
  }
  return [...set];
}

function tenantFromPayload(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.tenant_id === 'string' && payload.tenant_id.length > 0) {
    return payload.tenant_id;
  }
  const org = payload.organization as { id?: string } | undefined;
  if (typeof org?.id === 'string' && org.id.length > 0) return org.id;
  return undefined;
}

export function authUserFromJwtPayload(
  payload: Record<string, unknown>,
): AuthUser {
  const sub = payload.sub;
  if (typeof sub !== 'string') {
    throw new Error('Invalid token: missing sub');
  }
  return {
    sub,
    preferred_username:
      typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    tenant_id: tenantFromPayload(payload),
    roles: collectRoles(payload),
    permissions: Array.isArray(payload.permissions)
      ? payload.permissions.filter((p): p is string => typeof p === 'string')
      : [],
    raw: payload,
  };
}

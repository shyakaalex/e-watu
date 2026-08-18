"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUserFromJwtPayload = authUserFromJwtPayload;
function collectRoles(payload) {
    const direct = payload.roles;
    if (Array.isArray(direct)) {
        return direct.filter((r) => typeof r === 'string');
    }
    const set = new Set();
    const realmAccess = payload.realm_access;
    realmAccess?.roles?.forEach((r) => set.add(r));
    const resourceAccess = payload.resource_access;
    if (resourceAccess) {
        for (const c of Object.values(resourceAccess)) {
            c.roles?.forEach((r) => set.add(r));
        }
    }
    return [...set];
}
function tenantFromPayload(payload) {
    if (typeof payload.tenant_id === 'string' && payload.tenant_id.length > 0) {
        return payload.tenant_id;
    }
    const org = payload.organization;
    if (typeof org?.id === 'string' && org.id.length > 0)
        return org.id;
    return undefined;
}
function authUserFromJwtPayload(payload) {
    const sub = payload.sub;
    if (typeof sub !== 'string') {
        throw new Error('Invalid token: missing sub');
    }
    return {
        sub,
        preferred_username: typeof payload.preferred_username === 'string'
            ? payload.preferred_username
            : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        tenant_id: tenantFromPayload(payload),
        roles: collectRoles(payload),
        permissions: Array.isArray(payload.permissions)
            ? payload.permissions.filter((p) => typeof p === 'string')
            : [],
        raw: payload,
    };
}
//# sourceMappingURL=claims.js.map
import type { AuthUser } from './auth-user';
import { hasPermission } from './permission-matcher';

/**
 * The single authorization check: "can this user perform `action` on `resource`?"
 * Backed by the same `resource:action` permission strings as `@RequirePermissions`/
 * `PermissionsGuard` — this is not a second mechanism, just a callable form of it for
 * use in service-layer logic (e.g. field masking) and on the frontend, where a
 * decorator can't apply.
 *
 * Server-side guards remain the authoritative check. Frontend use of `can()` is for
 * hiding UI only — never trust it as the only enforcement layer.
 */
export function can(
  user: Pick<AuthUser, 'permissions'> | { permissions?: string[] } | null | undefined,
  action: string,
  resource: string,
): boolean {
  if (!user?.permissions?.length) return false;
  return hasPermission(user.permissions, `${resource}:${action}`);
}

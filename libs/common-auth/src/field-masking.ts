import type { AuthUser } from './auth-user';
import { can } from './can';

/**
 * Strips `fields` from `record` unless the caller holds `resource:read` (or a
 * matching wildcard). Field-level masking, distinct from — and layered on top of —
 * whatever endpoint/role check already gated the request: a caller can be fully
 * authorized to read the record and still not receive these specific fields.
 *
 * `allowSelf`: pass `record.id === callerEmployeeId` (or similar) when a person
 * viewing their own record should see their own masked fields regardless of
 * permission — omit it (or pass false) for resources with no such self-exception.
 */
export function maskFields<T extends Record<string, unknown>>(
  record: T,
  fields: readonly string[],
  user: Pick<AuthUser, 'permissions'> | { permissions?: string[] } | null | undefined,
  resource: string,
  allowSelf = false,
): T {
  if (allowSelf || can(user, 'read', resource)) return record;
  const masked = { ...record };
  for (const field of fields) {
    delete (masked as Record<string, unknown>)[field];
  }
  return masked;
}

/** Applies `maskFields` to every item in a list. */
export function maskFieldsList<T extends Record<string, unknown>>(
  records: T[],
  fields: readonly string[],
  user: Pick<AuthUser, 'permissions'> | { permissions?: string[] } | null | undefined,
  resource: string,
  allowSelfId?: (record: T) => boolean,
): T[] {
  return records.map((r) => maskFields(r, fields, user, resource, allowSelfId?.(r) ?? false));
}

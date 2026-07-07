/**
 * Checks if a user's permissions satisfy the required permission using wildcards.
 * Matches:
 *  - Global wildcards: `*:*` or `*` matches everything.
 *  - Resource-level wildcards: `employee:*` matches `employee:read`, `employee:write`, etc.
 *  - Exact match: `employee:read` matches `employee:read`.
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (userPermissions.includes('*:*') || userPermissions.includes('*')) {
    return true;
  }

  const [reqResource, reqAction] = requiredPermission.split(':');

  return userPermissions.some((userPerm) => {
    const [userResource, userAction] = userPerm.split(':');

    const resourceMatches = userResource === '*' || userResource === reqResource;
    const actionMatches = userAction === '*' || userAction === reqAction;

    return resourceMatches && actionMatches;
  });
}

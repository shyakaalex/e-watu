"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = hasPermission;
function hasPermission(userPermissions, requiredPermission) {
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
//# sourceMappingURL=permission-matcher.js.map
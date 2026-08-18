"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EwatuRolePermissions = exports.EwatuRole = void 0;
exports.getPermissionsForRoles = getPermissionsForRoles;
exports.EwatuRole = {
    PLATFORM_SUPER_ADMIN: 'PLATFORM_SUPER_ADMIN',
    TENANT_ADMIN: 'TENANT_ADMIN',
    TENANT_STAFF: 'TENANT_STAFF',
    HR_MANAGER: 'HR_MANAGER',
    FINANCE_OFFICER: 'FINANCE_OFFICER',
    RECRUITER: 'RECRUITER',
    PERMITS_OFFICER: 'PERMITS_OFFICER',
    CLIENT_ADMIN: 'CLIENT_ADMIN',
    CLIENT_EMPLOYEE: 'CLIENT_EMPLOYEE',
    PAYROLL_SPECIALIST: 'PAYROLL_SPECIALIST',
    CFO: 'CFO',
    PROCUREMENT_MANAGER: 'PROCUREMENT_MANAGER',
};
exports.EwatuRolePermissions = {
    [exports.EwatuRole.PLATFORM_SUPER_ADMIN]: ['*:*'],
    [exports.EwatuRole.TENANT_ADMIN]: ['*:*'],
    [exports.EwatuRole.HR_MANAGER]: ['employee:*', 'leave:approve', 'ats:write'],
    [exports.EwatuRole.PAYROLL_SPECIALIST]: ['payroll:run', 'payroll:read', 'tax:write'],
    [exports.EwatuRole.CFO]: ['finance:*', 'procurement:approve'],
    [exports.EwatuRole.PROCUREMENT_MANAGER]: ['procurement:*', 'inventory:*'],
    [exports.EwatuRole.TENANT_STAFF]: ['self:*'],
    [exports.EwatuRole.CLIENT_ADMIN]: ['self:*'],
    [exports.EwatuRole.CLIENT_EMPLOYEE]: ['self:*'],
    [exports.EwatuRole.FINANCE_OFFICER]: ['payroll:read', 'payroll:run', 'finance:*'],
    [exports.EwatuRole.RECRUITER]: ['ats:write', 'employee:read'],
    [exports.EwatuRole.PERMITS_OFFICER]: ['employee:read'],
};
function getPermissionsForRoles(roles) {
    const permissions = new Set();
    for (const role of roles) {
        const perms = exports.EwatuRolePermissions[role];
        if (perms) {
            perms.forEach((p) => permissions.add(p));
        }
    }
    return [...permissions];
}
//# sourceMappingURL=ewatu-role.js.map
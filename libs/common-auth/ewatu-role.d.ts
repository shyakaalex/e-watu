export declare const EwatuRole: {
    readonly PLATFORM_SUPER_ADMIN: "PLATFORM_SUPER_ADMIN";
    readonly TENANT_ADMIN: "TENANT_ADMIN";
    readonly TENANT_STAFF: "TENANT_STAFF";
    readonly HR_MANAGER: "HR_MANAGER";
    readonly FINANCE_OFFICER: "FINANCE_OFFICER";
    readonly RECRUITER: "RECRUITER";
    readonly PERMITS_OFFICER: "PERMITS_OFFICER";
    readonly CLIENT_ADMIN: "CLIENT_ADMIN";
    readonly CLIENT_EMPLOYEE: "CLIENT_EMPLOYEE";
    readonly PAYROLL_SPECIALIST: "PAYROLL_SPECIALIST";
    readonly CFO: "CFO";
    readonly PROCUREMENT_MANAGER: "PROCUREMENT_MANAGER";
};
export type EwatuRoleName = (typeof EwatuRole)[keyof typeof EwatuRole];
export declare const EwatuRolePermissions: Record<EwatuRoleName, string[]>;
export declare function getPermissionsForRoles(roles: string[]): string[];

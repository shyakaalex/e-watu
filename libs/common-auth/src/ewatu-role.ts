/** Align with EWatu spec §5.1; stored on users and embedded in JWT `roles`. */
export const EwatuRole = {
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
  MANAGING_DIRECTOR: 'MANAGING_DIRECTOR',
} as const;

export type EwatuRoleName = (typeof EwatuRole)[keyof typeof EwatuRole];

export const EwatuRolePermissions: Record<EwatuRoleName, string[]> = {
  [EwatuRole.PLATFORM_SUPER_ADMIN]: ['*:*'],
  [EwatuRole.TENANT_ADMIN]: ['*:*'],
  [EwatuRole.HR_MANAGER]: ['employee:*', 'leave:approve', 'ats:write', 'lending:apply'],
  [EwatuRole.PAYROLL_SPECIALIST]: [
    'payroll:run',
    'payroll:read',
    'tax:write',
    'employee-compensation:read',
    'employee-compensation:write',
  ],
  [EwatuRole.CFO]: [
    'finance:*',
    'procurement:approve',
    'lending:approve',
    'employee-compensation:read',
  ],
  [EwatuRole.PROCUREMENT_MANAGER]: ['procurement:*', 'inventory:*'],
  [EwatuRole.TENANT_STAFF]: ['self:*', 'lending:apply'],
  [EwatuRole.CLIENT_ADMIN]: ['self:*'],
  [EwatuRole.CLIENT_EMPLOYEE]: ['self:*'],
  [EwatuRole.FINANCE_OFFICER]: [
    'payroll:read',
    'payroll:run',
    'finance:*',
    'lending:*',
    'employee-compensation:read',
    'employee-compensation:write',
  ],
  [EwatuRole.RECRUITER]: ['ats:write', 'employee:read'],
  [EwatuRole.PERMITS_OFFICER]: ['employee:read'],
  [EwatuRole.MANAGING_DIRECTOR]: ['*:*'],
} as const;

/**
 * Employee fields considered compensation-sensitive. Gated behind the
 * `employee-compensation:read`/`write` permission (see `can()`), independent of
 * whether the caller can otherwise read the rest of the Employee record —
 * e.g. HR_MANAGER can see and approve leave for an employee without ever
 * receiving that employee's salary/allowance figures in the same payload.
 */
export const COMPENSATION_FIELDS = [
  'basicSalary',
  'housingAllowance',
  'transportAllowance',
  'otherAllowances',
] as const;

export function getPermissionsForRoles(roles: string[]): string[] {
  const permissions = new Set<string>();
  for (const role of roles) {
    const perms = EwatuRolePermissions[role as EwatuRoleName];
    if (perms) {
      perms.forEach((p) => permissions.add(p));
    }
  }
  return [...permissions];
}


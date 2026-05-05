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
} as const;

export type EwatuRoleName = (typeof EwatuRole)[keyof typeof EwatuRole];

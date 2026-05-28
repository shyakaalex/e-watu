export function hasAnyRole(userRoles: string[], allowed: string[]): boolean {
  return userRoles.some((r) => allowed.includes(r));
}

export const RECRUITMENT_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'TENANT_STAFF'];
export const PLACEMENTS_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'];
export const TALENT_POOL_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER'];
export const PAYROLL_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER', 'CLIENT_ADMIN'];

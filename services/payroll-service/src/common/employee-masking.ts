import { COMPENSATION_FIELDS, maskFields } from '@ewatu/common-auth';

type EmployeeLike = Record<string, unknown> & { manager?: Record<string, unknown> | null };
type WithEmployee = { employee?: EmployeeLike | null; reviewer?: EmployeeLike | null };

const EMBEDDED_EMPLOYEE_KEYS = ['employee', 'reviewer'] as const;

/**
 * Masks compensation fields (salary, allowances) on a record's embedded Employee
 * sub-object(s) — `employee`, `employee.manager`, and `reviewer` (the 360-feedback
 * reviewer is itself a full Employee), whichever are present. Records with none of
 * these keys pass through unchanged. Used anywhere Performance/Leave responses embed
 * a full Employee object for a viewer who may lack `employee-compensation:read` (e.g.
 * an HR_MANAGER reviewing goals or appraisals has no reason to see pay figures there).
 */
export function maskEmbeddedEmployee<T extends WithEmployee>(record: T, callerPermissions?: string[]): T {
  const caller = { permissions: callerPermissions };
  const result: Record<string, unknown> = { ...record };

  for (const key of EMBEDDED_EMPLOYEE_KEYS) {
    const value = (record as Record<string, EmployeeLike | null | undefined>)[key];
    if (!value) continue;
    const masked = maskFields(value, COMPENSATION_FIELDS, caller, 'employee-compensation');
    if (value.manager) {
      (masked as EmployeeLike).manager = maskFields(value.manager, COMPENSATION_FIELDS, caller, 'employee-compensation');
    }
    result[key] = masked;
  }

  return result as T;
}

export function maskEmbeddedEmployeeList<T extends WithEmployee>(records: T[], callerPermissions?: string[]): T[] {
  return records.map((r) => maskEmbeddedEmployee(r, callerPermissions));
}

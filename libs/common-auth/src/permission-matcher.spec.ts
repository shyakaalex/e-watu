import { hasPermission } from './permission-matcher';

describe('hasPermission', () => {
  it('should return true for global wildcard *:*', () => {
    expect(hasPermission(['*:*'], 'employee:read')).toBe(true);
    expect(hasPermission(['*:*'], 'payroll:run')).toBe(true);
  });

  it('should return true for global wildcard *', () => {
    expect(hasPermission(['*'], 'employee:read')).toBe(true);
    expect(hasPermission(['*'], 'payroll:run')).toBe(true);
  });

  it('should return true for resource-level wildcard resource:*', () => {
    expect(hasPermission(['employee:*'], 'employee:read')).toBe(true);
    expect(hasPermission(['employee:*'], 'employee:write')).toBe(true);
    expect(hasPermission(['employee:*'], 'payroll:run')).toBe(false);
  });

  it('should return true for exact match', () => {
    expect(hasPermission(['employee:read', 'leave:approve'], 'employee:read')).toBe(true);
    expect(hasPermission(['employee:read', 'leave:approve'], 'leave:approve')).toBe(true);
    expect(hasPermission(['employee:read', 'leave:approve'], 'employee:write')).toBe(false);
  });

  it('should handle complex multiple permissions combinations', () => {
    const userPerms = ['employee:read', 'leave:*', 'payroll:run'];
    expect(hasPermission(userPerms, 'employee:read')).toBe(true);
    expect(hasPermission(userPerms, 'employee:write')).toBe(false);
    expect(hasPermission(userPerms, 'leave:approve')).toBe(true);
    expect(hasPermission(userPerms, 'leave:reject')).toBe(true);
    expect(hasPermission(userPerms, 'payroll:run')).toBe(true);
    expect(hasPermission(userPerms, 'payroll:read')).toBe(false);
  });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permission_matcher_1 = require("./permission-matcher");
describe('hasPermission', () => {
    it('should return true for global wildcard *:*', () => {
        expect((0, permission_matcher_1.hasPermission)(['*:*'], 'employee:read')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(['*:*'], 'payroll:run')).toBe(true);
    });
    it('should return true for global wildcard *', () => {
        expect((0, permission_matcher_1.hasPermission)(['*'], 'employee:read')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(['*'], 'payroll:run')).toBe(true);
    });
    it('should return true for resource-level wildcard resource:*', () => {
        expect((0, permission_matcher_1.hasPermission)(['employee:*'], 'employee:read')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(['employee:*'], 'employee:write')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(['employee:*'], 'payroll:run')).toBe(false);
    });
    it('should return true for exact match', () => {
        expect((0, permission_matcher_1.hasPermission)(['employee:read', 'leave:approve'], 'employee:read')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(['employee:read', 'leave:approve'], 'leave:approve')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(['employee:read', 'leave:approve'], 'employee:write')).toBe(false);
    });
    it('should handle complex multiple permissions combinations', () => {
        const userPerms = ['employee:read', 'leave:*', 'payroll:run'];
        expect((0, permission_matcher_1.hasPermission)(userPerms, 'employee:read')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(userPerms, 'employee:write')).toBe(false);
        expect((0, permission_matcher_1.hasPermission)(userPerms, 'leave:approve')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(userPerms, 'leave:reject')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(userPerms, 'payroll:run')).toBe(true);
        expect((0, permission_matcher_1.hasPermission)(userPerms, 'payroll:read')).toBe(false);
    });
});
//# sourceMappingURL=permission-matcher.spec.js.map
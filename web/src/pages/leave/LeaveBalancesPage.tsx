import { useEffect, useState } from 'react';
import { fetchEmployees, fetchLeaveTypes, fetchLeaveBalances } from '../../payrollApi';

export function LeaveBalancesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balancesMap, setBalancesMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empList, types] = await Promise.all([fetchEmployees(), fetchLeaveTypes()]);
      setEmployees(empList);
      setLeaveTypes(types);

      // Fetch balances for each employee
      const map: Record<string, any[]> = {};
      await Promise.all(
        empList.map(async (emp) => {
          try {
            const bal = await fetchLeaveBalances(emp.id);
            map[emp.id] = bal;
          } catch {
            map[emp.id] = [];
          }
        }),
      );
      setBalancesMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  if (loading) {
    return (
      <div className="rec-page" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="muted">Loading employee leave balances…</p>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Employee Leave Balances</h1>
          <p className="muted">Overview of leave allocations and usage across all company employees ({new Date().getFullYear()}).</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: '360px' }}>
        <input
          type="text"
          placeholder="Search employee by name or email..."
          className="auth-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <section className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department / Title</th>
                {leaveTypes.map((t) => (
                  <th key={t.id} style={{ textAlign: 'center' }}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={2 + leaveTypes.length} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                    No employees found matching filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empBalances = balancesMap[emp.id] || [];
                  return (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.firstName} {emp.lastName}</strong>
                        <div className="muted" style={{ fontSize: '0.75rem' }}>{emp.email}</div>
                      </td>
                      <td className="muted" style={{ fontSize: '0.85rem' }}>
                        {emp.jobTitle || 'Employee'}
                        {emp.department ? ` (${emp.department})` : ''}
                      </td>
                      {leaveTypes.map((t) => {
                        const b = empBalances.find((item) => item.leaveTypeId === t.id);
                        if (!b) {
                          return (
                            <td key={t.id} style={{ textAlign: 'center' }} className="muted">
                              {t.defaultDays} d (full)
                            </td>
                          );
                        }
                        const remaining = Number(b.allocatedDays) - Number(b.usedDays);
                        return (
                          <td key={t.id} style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: remaining <= 2 ? 'var(--danger, #ef4444)' : 'inherit' }}>
                              {remaining}
                            </span>{' '}
                            <span className="muted" style={{ fontSize: '0.75rem' }}>/ {b.allocatedDays} d</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

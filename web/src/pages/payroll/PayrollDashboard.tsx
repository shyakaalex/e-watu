import { useEffect, useState } from 'react';
import { createPeriod, fetchEmployees, fetchExpiringContracts, fetchPeriods } from '../../payrollApi';

export function PayrollDashboard() {
  const [stats, setStats] = useState({ activeEmployees: 0, periodsNeedingAction: 0, expiringContracts: 0 });
  const [recentPeriods, setRecentPeriods] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetchEmployees({ employmentStatus: 'ACTIVE' }),
      fetchPeriods({}),
      fetchExpiringContracts(30),
    ]).then(([employees, periods, contracts]: any) => {
      const list = Array.isArray(periods) ? periods : [];
      setStats({
        activeEmployees: Array.isArray(employees) ? employees.length : (employees?.data?.length ?? 0),
        periodsNeedingAction: list.filter((period) => period.status !== 'FINALIZED').length,
        expiringContracts: Array.isArray(contracts) ? contracts.length : 0,
      });
      setRecentPeriods(list.slice(0, 5));
    });
  }, []);

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Payroll Dashboard</h1>
      <div className="rec-form__grid">
        <div className="card"><h3>Total Active Employees</h3><p>{stats.activeEmployees}</p></div>
        <div className="card"><h3>Periods Needing Action</h3><p>{stats.periodsNeedingAction}</p></div>
        <div className="card"><h3>Contracts Expiring Soon</h3><p>{stats.expiringContracts}</p></div>
      </div>
      <button className="btn btn--primary" onClick={() => createPeriod({ clientId: 'client-1', periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear() })}>
        Quick New Payroll Period
      </button>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 className="rec-form-card__title">Recent periods</h2>
        <ul>{recentPeriods.map((p) => <li key={p.id}>{p.clientId} - {p.periodMonth}/{p.periodYear} ({p.status})</li>)}</ul>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createPeriod,
  fetchEmployees,
  fetchExpiringContracts,
  fetchPayrollConfigClients,
  fetchPeriods,
} from '../../payrollApi';

export function PayrollDashboard() {
  const [stats, setStats] = useState({ activeEmployees: 0, periodsNeedingAction: 0, expiringContracts: 0 });
  const [recentPeriods, setRecentPeriods] = useState<any[]>([]);
  const [clients, setClients] = useState<{ clientId: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchEmployees({ employmentStatus: 'ACTIVE' }),
      fetchPeriods({}),
      fetchExpiringContracts(30),
      fetchPayrollConfigClients(),
    ]).then(([employees, periods, contracts, clientList]) => {
      const list = Array.isArray(periods) ? periods : [];
      setStats({
        activeEmployees: Array.isArray(employees) ? employees.length : (employees?.data?.length ?? 0),
        periodsNeedingAction: list.filter((period: any) => period.status !== 'FINALIZED').length,
        expiringContracts: Array.isArray(contracts) ? contracts.length : 0,
      });
      setRecentPeriods(list.slice(0, 5));
      setClients(clientList);
      if (clientList.length > 0) setSelectedClientId(clientList[0].clientId);
    });
  }, []);

  const onQuickCreate = async () => {
    if (!selectedClientId) return;
    setCreating(true);
    setCreateMsg(null);
    try {
      await createPeriod({
        clientId: selectedClientId,
        periodMonth: new Date().getMonth() + 1,
        periodYear: new Date().getFullYear(),
      });
      setCreateMsg('Payroll period created.');
      const periods = await fetchPeriods({});
      const list = Array.isArray(periods) ? periods : [];
      setRecentPeriods(list.slice(0, 5));
    } catch (e) {
      setCreateMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Payroll Dashboard</h1>
      <div className="rec-form__grid">
        <div className="card"><h3>Total Active Employees</h3><p>{stats.activeEmployees}</p></div>
        <div className="card"><h3>Periods Needing Action</h3><p>{stats.periodsNeedingAction}</p></div>
        <div className="card"><h3>Contracts Expiring Soon</h3><p>{stats.expiringContracts}</p></div>
      </div>

      <div className="card rec-form-card" style={{ marginTop: '1rem' }}>
        <h2 className="rec-form-card__title">Quick New Payroll Period</h2>
        {clients.length === 0 ? (
          <div>
            <p className="muted">
              No clients configured yet. Go to Payroll → Configuration to add your first client payroll setup.
            </p>
            <Link to="/payroll/config/new" className="btn btn--primary" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
              Add payroll configuration
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="rec-form__label" style={{ margin: 0 }}>
              Client
              <select className="auth-input" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>{c.clientId}</option>
                ))}
              </select>
            </label>
            <button className="btn btn--primary" disabled={creating || !selectedClientId} onClick={onQuickCreate}>
              {creating ? 'Creating…' : 'Create Period'}
            </button>
          </div>
        )}
        {createMsg && <p className="muted" style={{ marginTop: '0.75rem' }}>{createMsg}</p>}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 className="rec-form-card__title">Recent periods</h2>
        <ul>{recentPeriods.map((p) => <li key={p.id}>{p.clientId} - {p.periodMonth}/{p.periodYear} ({p.status})</li>)}</ul>
      </div>
    </div>
  );
}

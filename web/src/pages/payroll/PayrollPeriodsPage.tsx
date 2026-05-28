import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPeriod, fetchPeriods } from '../../payrollApi';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  SUBMITTED: '#2563eb',
  HR_APPROVED: '#4f46e5',
  MD_APPROVED: '#7e22ce',
  CLIENT_APPROVED: '#ea580c',
  FINALIZED: '#16a34a',
};

export function PayrollPeriodsPage() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<any[]>([]);
  const [filters, setFilters] = useState({ clientId: '', status: 'ALL', periodYear: String(new Date().getFullYear()) });
  const [newPeriod, setNewPeriod] = useState({ clientId: '', periodMonth: String(new Date().getMonth() + 1), periodYear: String(new Date().getFullYear()) });

  const load = useCallback(async () => {
    const data = await fetchPeriods({
      clientId: filters.clientId || undefined,
      status: filters.status === 'ALL' ? undefined : filters.status,
      periodYear: filters.periodYear || undefined,
    });
    setPeriods(data as any[]);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const createNew = async (e: FormEvent) => {
    e.preventDefault();
    await createPeriod({ ...newPeriod, periodMonth: Number(newPeriod.periodMonth), periodYear: Number(newPeriod.periodYear) });
    await load();
  };

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Payroll periods</h1>
      <div className="card rec-form-card">
        <div className="rec-form__grid">
          <label className="rec-form__label">Client ID<input className="auth-input" value={filters.clientId} onChange={(e) => setFilters((p) => ({ ...p, clientId: e.target.value }))} /></label>
          <label className="rec-form__label">Status<select className="auth-input" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}><option value="ALL">ALL</option><option>DRAFT</option><option>SUBMITTED</option><option>HR_APPROVED</option><option>MD_APPROVED</option><option>CLIENT_APPROVED</option><option>FINALIZED</option></select></label>
          <label className="rec-form__label">Year<input className="auth-input" value={filters.periodYear} onChange={(e) => setFilters((p) => ({ ...p, periodYear: e.target.value }))} /></label>
        </div>
      </div>
      <div className="card rec-form-card">
        <h2 className="rec-form-card__title">New period</h2>
        <form className="rec-form" onSubmit={createNew}>
          <div className="rec-form__grid">
            <label className="rec-form__label">Client ID<input className="auth-input" value={newPeriod.clientId} onChange={(e) => setNewPeriod((p) => ({ ...p, clientId: e.target.value }))} required /></label>
            <label className="rec-form__label">Month<input className="auth-input" type="number" min={1} max={12} value={newPeriod.periodMonth} onChange={(e) => setNewPeriod((p) => ({ ...p, periodMonth: e.target.value }))} required /></label>
            <label className="rec-form__label">Year<input className="auth-input" value={newPeriod.periodYear} onChange={(e) => setNewPeriod((p) => ({ ...p, periodYear: e.target.value }))} required /></label>
          </div>
          <button className="btn btn--primary" type="submit">Create period</button>
        </form>
      </div>
      <div className="rec-table-wrap">
        <table className="rec-table">
          <thead><tr><th>Client ID</th><th>Period</th><th>Status</th><th>Records</th><th>Actions</th></tr></thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/payroll/periods/${p.id}`)} style={{ cursor: 'pointer' }}>
                <td>{p.clientId}</td>
                <td>{p.periodMonth}/{p.periodYear}</td>
                <td><span style={{ color: STATUS_COLORS[p.status] ?? '#111827' }}>{p.status}</span></td>
                <td>{p._count?.records ?? 0}</td>
                <td><button className="btn btn--ghost small">Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

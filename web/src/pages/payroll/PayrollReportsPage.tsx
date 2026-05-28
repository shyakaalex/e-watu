import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '../../lib/http';
import {
  fetchEmployeeP9,
  fetchEmployees,
  fetchPayrollRuns,
  payslipZipUrl,
  reportDownloadUrl,
  type Employee,
  type EmployeeP9Report,
  type PayrollRun,
} from '../../payrollApi';

export function PayrollReportsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [p9EmployeeId, setP9EmployeeId] = useState('');
  const [p9Year, setP9Year] = useState(new Date().getFullYear());
  const [p9Report, setP9Report] = useState<EmployeeP9Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [all, emps] = await Promise.all([fetchPayrollRuns(), fetchEmployees()]);
      const locked = all.filter((r) => r.status === 'LOCKED');
      setRuns(locked);
      setEmployees(emps);
      if (locked[0]) setSelectedId(locked[0].id);
      if (emps[0]) setP9EmployeeId(emps[0].id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (url: string, filename: string) => {
    setErr(null);
    try {
      const r = await authFetch(url);
      if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
      const blob = await r.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const loadP9 = async () => {
    if (!p9EmployeeId) return;
    setErr(null);
    try {
      setP9Report(await fetchEmployeeP9(p9EmployeeId, p9Year));
    } catch (e) {
      setP9Report(null);
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const downloadP9Json = () => {
    if (!p9Report) return;
    const blob = new Blob([JSON.stringify(p9Report, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `p9-${p9Report.employeeId}-${p9Year}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const selected = runs.find((r) => r.id === selectedId);

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Reports & exports</h1>
      <p className="rec-page__sub">Period reports require a locked payroll run</p>
      {err && <div className="alert alert--err">{err}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="card rec-form-card" style={{ marginBottom: '1rem' }}>
            <h2 className="rec-form-card__title">Period exports</h2>
            {runs.length === 0 ? (
              <p className="muted">No locked runs yet. Lock a payroll run to export reports.</p>
            ) : (
              <>
                <label className="rec-form__label">
                  Locked run
                  <select className="auth-input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                    {runs.map((run) => (
                      <option key={run.id} value={run.id}>
                        {run.periodYear}-{String(run.periodMonth).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </label>
                {selected && (
                  <div className="rec-form__actions" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button type="button" className="btn btn--primary" onClick={() => download(reportDownloadUrl(selected.id, 'paye'), `paye-${selected.id}.csv`)}>PAYE CSV</button>
                    <button type="button" className="btn btn--primary" onClick={() => download(reportDownloadUrl(selected.id, 'rssb'), `rssb-${selected.id}.csv`)}>RSSB CSV</button>
                    <button type="button" className="btn btn--primary" onClick={() => download(reportDownloadUrl(selected.id, 'bank-file'), `bank-${selected.id}.csv`)}>Bank file CSV</button>
                    <button type="button" className="btn btn--ghost" onClick={() => download(payslipZipUrl(selected.id), `payslips-${selected.id}.zip`)}>Payslips ZIP</button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card rec-form-card">
            <h2 className="rec-form-card__title">P9 annual certificate</h2>
            <div className="rec-form__grid">
              <label className="rec-form__label">
                Employee
                <select className="auth-input" value={p9EmployeeId} onChange={(e) => setP9EmployeeId(e.target.value)}>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                Tax year
                <input className="auth-input" type="number" min={2000} max={2100} value={p9Year} onChange={(e) => setP9Year(Number(e.target.value))} />
              </label>
            </div>
            <div className="rec-form__actions">
              <button type="button" className="btn btn--primary" onClick={loadP9} disabled={!p9EmployeeId}>Load P9</button>
              {p9Report && (
                <button type="button" className="btn btn--ghost" onClick={downloadP9Json}>Download JSON</button>
              )}
            </div>
            {p9Report && (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>{p9Report.employeeName}</strong> · {p9Report.year} · {p9Report.periods.length} period(s)</p>
                <p className="muted small">
                  Gross: {p9Report.totals.gross} · PAYE: {p9Report.totals.paye} · Net: {p9Report.totals.net}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

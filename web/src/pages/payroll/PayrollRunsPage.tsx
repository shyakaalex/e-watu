import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPayrollRun, fetchPayrollRuns, type PayrollRun } from '../../payrollApi';

export function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setRuns(await fetchPayrollRuns());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await createPayrollRun({ periodYear: year, periodMonth: month });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Payroll runs</h1>
          <p className="rec-page__sub">{runs.length} run{runs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      <div className="card rec-form-card">
        <h2 className="rec-form-card__title">Create run</h2>
        <form className="rec-form" onSubmit={onCreate}>
          <div className="rec-form__grid">
            <label className="rec-form__label">
              Year
              <input className="auth-input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
            </label>
            <label className="rec-form__label">
              Month
              <input className="auth-input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} required />
            </label>
          </div>
          <div className="rec-form__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create run'}</button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="muted">Loading runs…</p>
      ) : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Status</th>
                <th>Currency</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>{run.periodYear}-{String(run.periodMonth).padStart(2, '0')}</td>
                  <td>{run.status}</td>
                  <td>{run.currency}</td>
                  <td><Link to={`/payroll/runs/${run.id}`} className="btn btn--ghost small">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPayrollRuns, type PayrollRun } from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

const NEXT_APPROVER_BY_STATUS: Record<string, string> = {
  SUBMITTED: 'HR_MANAGER',
  HR_APPROVED: 'MD',
  MD_APPROVED: 'CLIENT_ADMIN',
};

export function PayrollApprovalsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const all = await fetchPayrollRuns();
      setRuns(all.filter((r) => r.status in NEXT_APPROVER_BY_STATUS));
    } catch (e) {
      setErr(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Approval inbox</h1>
      <p className="rec-page__sub">Payroll runs awaiting approval</p>
      {err && <div className="alert alert--err">{err}</div>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : runs.length === 0 ? (
        <p className="muted">No runs in review.</p>
      ) : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Pending stage</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const pending = NEXT_APPROVER_BY_STATUS[run.status] ?? '—';
                return (
                  <tr key={run.id}>
                    <td>{run.periodYear}-{String(run.periodMonth).padStart(2, '0')}</td>
                    <td>{pending}</td>
                    <td><Link to={`/payroll/runs/${run.id}`} className="btn btn--primary small">Review</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

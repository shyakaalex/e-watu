import { useCallback, useEffect, useState } from 'react';
import { fetchOutsourcingBilling, type OutsourcingBillingSummary } from '../../payrollApi';

function defaultPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function PayrollBillingPage() {
  const [period, setPeriod] = useState(defaultPeriod());
  const [summary, setSummary] = useState<OutsourcingBillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(period)) {
      setErr('Period must use YYYY-MM format');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      setSummary(await fetchOutsourcingBilling(period));
    } catch (e) {
      setSummary(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Outsourcing billing</h1>
          <p className="rec-page__sub">Draft monthly billing from active assignments</p>
        </div>
      </div>

      <div className="card rec-form-card" style={{ marginBottom: '1rem' }}>
        <div className="rec-form__grid">
          <label className="rec-form__label">
            Billing period (YYYY-MM)
            <input
              className="auth-input"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-05"
            />
          </label>
        </div>
        <div className="rec-form__actions">
          <button type="button" className="btn btn--primary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {summary && (
        <>
          <p className="rec-page__sub">
            {summary.lineCount} line{summary.lineCount !== 1 ? 's' : ''} · Status: {summary.status}
            {Object.entries(summary.totalsByCurrency).map(([currency, total]) => (
              <span key={currency}> · Total {currency}: {total}</span>
            ))}
          </p>

          {summary.lines.length === 0 ? (
            <p className="muted">No active assignments for this period.</p>
          ) : (
            <div className="rec-table-wrap">
              <table className="rec-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Client</th>
                    <th>Role</th>
                    <th>Site</th>
                    <th>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.lines.map((line) => (
                    <tr key={line.assignmentId}>
                      <td>{line.employeeName}</td>
                      <td>{line.clientName}</td>
                      <td>{line.roleName}</td>
                      <td>{line.deploymentSite ?? '—'}</td>
                      <td>{line.monthlyFee} {line.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

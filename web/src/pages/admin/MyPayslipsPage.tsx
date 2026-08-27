import { useCallback, useEffect, useState } from 'react';
import { fetchMyPayslips } from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

type Payslip = {
  periodId: string;
  periodMonth: number;
  periodYear: number;
  netPay: string;
  downloadUrl: string | null;
  payslipText: string;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await fetchMyPayslips();
      setPayslips(list as Payslip[]);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">My Payslips</h1>
        <p className="adm-page__lead">Your payslip history, downloadable where available.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : payslips.length === 0 ? (
        <div className="adm-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p className="muted">No payslips have been issued yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {payslips.map((p) => (
            <div key={p.periodId} className="adm-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <strong>{MONTHS[p.periodMonth - 1]} {p.periodYear}</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>Net Pay: {p.netPay}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn--ghost small"
                    onClick={() => setExpanded(expanded === p.periodId ? null : p.periodId)}
                  >
                    {expanded === p.periodId ? 'Hide Details' : 'View Details'}
                  </button>
                  {p.downloadUrl && (
                    <a href={p.downloadUrl} target="_blank" rel="noreferrer" className="btn btn--primary small">
                      Download
                    </a>
                  )}
                </div>
              </div>
              {expanded === p.periodId && (
                <pre
                  style={{
                    marginTop: '1rem', padding: '1rem', background: 'rgba(148, 163, 184, 0.08)',
                    borderRadius: 8, fontSize: '0.82rem', overflowX: 'auto', whiteSpace: 'pre-wrap',
                  }}
                >
                  {p.payslipText}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

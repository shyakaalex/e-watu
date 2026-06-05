import { useCallback, useEffect, useState } from 'react';
import { fetchOutsourcingBilling, type OutsourcingBillingSummary } from '../../payrollApi';

function defaultPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function PayrollBillingPage() {
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [summary, setSummary] = useState<OutsourcingBillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const load = useCallback(async () => {
    const period = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
    setLoading(true); setErr(null);
    try {
      setSummary(await fetchOutsourcingBilling(period));
    } catch (e) {
      setSummary(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, [periodYear, periodMonth]);

  useEffect(() => { load(); }, [load]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Outsourcing Billing</h1>
          <p className="rec-page__sub">Monthly invoice draft per client</p>
        </div>
        {summary && (
          <button className="btn btn--primary" onClick={() => window.print()}>Export / Print</button>
        )}
      </div>

      <div className="card rec-form-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label className="rec-form__label" style={{ margin: 0 }}>
            Year
            <select className="auth-input" value={periodYear} onChange={e => setPeriodYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="rec-form__label" style={{ margin: 0 }}>
            Month
            <select className="auth-input" value={periodMonth} onChange={e => setPeriodMonth(e.target.value)}>
              {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
            </select>
          </label>
          <button className="btn btn--primary" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Load billing'}</button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {summary && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>Employees billed</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{summary.lineCount}</div>
            </div>
            <div className="card" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>Clients</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{Object.keys(summary.byClient).length}</div>
            </div>
            {Object.entries(summary.totalsByCurrency).map(([currency, total]) => (
              <div key={currency} className="card" style={{ padding: '1rem 1.1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>Total {currency}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{Number(total).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Per-client invoice breakdown */}
          {Object.keys(summary.byClient).length === 0 ? (
            <p className="muted">No active assignments for this period.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(summary.byClient).map(([clientName, lines]) => {
                const clientTotal = lines.reduce((s, l) => s + parseFloat(l.billingRate), 0);
                const currency = lines[0]?.currency ?? 'RWF';
                const isExpanded = expandedClient === clientName;

                return (
                  <div key={clientName} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Client header */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--line)' : 'none', background: 'var(--surface)' }}
                      onClick={() => setExpandedClient(isExpanded ? null : clientName)}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{clientName}</div>
                        <div className="muted" style={{ fontSize: '0.825rem' }}>{lines.length} employee{lines.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{clientTotal.toLocaleString()} {currency}</div>
                          <div className="muted" style={{ fontSize: '0.78rem' }}>DRAFT · {MONTHS[summary.periodMonth - 1]} {summary.periodYear}</div>
                        </div>
                        <span style={{ color: 'var(--ink-muted)', fontSize: '1rem' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Invoice line items */}
                    {isExpanded && (
                      <div style={{ padding: '0' }}>
                        <table className="rec-table" style={{ margin: 0, border: 'none' }}>
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Role</th>
                              <th>Site</th>
                              <th>Period</th>
                              <th style={{ textAlign: 'right' }}>Billing rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lines.map(line => (
                              <tr key={line.assignmentId}>
                                <td>{line.employeeName}</td>
                                <td>{line.roleName}</td>
                                <td>{line.deploymentSite ?? '—'}</td>
                                <td className="muted">{MONTHS[summary.periodMonth - 1]} {summary.periodYear}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(line.billingRate).toLocaleString()} {line.currency}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid var(--line)' }}>
                              <td colSpan={4} style={{ fontWeight: 700, padding: '0.75rem 1rem' }}>Total</td>
                              <td style={{ fontWeight: 800, fontSize: '1rem', textAlign: 'right', padding: '0.75rem 1rem' }}>{clientTotal.toLocaleString()} {currency}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

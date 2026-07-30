import { useEffect, useState } from 'react';
import { parseApiError } from '../../lib/parseApiError';
import { fetchLeaveTypes, type LeaveType } from '../../payrollApi';

export function LeavePolicyPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveTypes()
      .then(setLeaveTypes)
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Leave Policy & Guidelines</h1>
          <p className="muted">Entitlements and rules for requesting time off.</p>
        </div>
      </div>

      {error && <div className="alert alert--err">{error}</div>}

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Leave Entitlements</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Annual Allocation</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.name}</strong></td>
                    <td>{Number(t.defaultDays) === 0 ? 'Unpaid' : `${t.defaultDays} days / year`}</td>
                    <td className="muted">{t.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>General Guidelines</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
          <li>Submit leave requests as far in advance as possible — annual leave should be requested at least 2 weeks ahead where practical.</li>
          <li>Sick leave may require a supporting medical certificate for absences longer than 2 consecutive days; attach it when submitting your request.</li>
          <li>All requests require manager or HR approval before the leave is confirmed. You'll see the status update on your Leave Requests page.</li>
          <li>Weekends are automatically excluded when calculating the number of working days for a request.</li>
          <li>You may nominate a colleague to cover urgent responsibilities while you're away using the "Delegate Work To" field.</li>
          <li>Unused annual leave balances are governed by your company's carry-over policy — check with HR for specifics.</li>
        </ul>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { parseApiError } from '../../lib/parseApiError';
import { fetchMyEmployee, fetchLeaveRequests, type LeaveRequest } from '../../payrollApi';

function exportCsv(requests: LeaveRequest[]) {
  const header = ['Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Applied On'];
  const rows = requests.map((r) => [
    r.leaveType?.name ?? '',
    new Date(r.startDate).toLocaleDateString(),
    new Date(r.endDate).toLocaleDateString(),
    String(r.numberOfDays),
    r.status,
    (r.reason ?? '').replace(/"/g, '""'),
    new Date(r.createdAt).toLocaleDateString(),
  ]);
  const csv = [header, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-leave-history.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function LeaveRequestsPage() {
  const location = useLocation();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>('ALL');
  const [justSubmitted] = useState(Boolean((location.state as { submitted?: boolean } | null)?.submitted));

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const matchedEmp = await fetchMyEmployee();
        const reqs = await fetchLeaveRequests(undefined, matchedEmp?.id);
        setRequests(reqs);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const years = useMemo(() => {
    const set = new Set(requests.map((r) => new Date(r.startDate).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [requests]);

  const sorted = [...requests]
    .filter((r) => year === 'ALL' || new Date(r.startDate).getFullYear() === Number(year))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <div className="rec-page" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="muted">Loading your leave requests…</p>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">My Leave Requests</h1>
          <p className="muted">Full history of your submitted leave requests.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button type="button" className="btn btn--ghost" onClick={() => exportCsv(sorted)} disabled={sorted.length === 0}>
            Export CSV
          </button>
          <Link to="/leave/apply" className="btn btn--primary">+ Apply for Leave</Link>
        </div>
      </div>

      {error && <div className="alert alert--err">{error}</div>}
      {justSubmitted && (
        <div className="alert alert--ok">Leave request submitted successfully. Status: Pending Manager Approval.</div>
      )}

      {years.length > 1 && (
        <div style={{ marginBottom: '1rem' }}>
          <label className="rec-form__label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Year
            <select className="auth-input" style={{ width: 'auto' }} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="ALL">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <section className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Approver Notes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                    No leave requests found. Click "+ Apply for Leave" to create a request.
                  </td>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.leaveType?.name}</strong></td>
                    <td>
                      {new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td>{r.numberOfDays}</td>
                    <td className="muted">{r.reason || '—'}</td>
                    <td>
                      <span className={`badge ${
                        r.status === 'APPROVED' ? 'badge--green' : r.status === 'REJECTED' ? 'badge--red' : 'badge--orange'
                      }`}>
                        {r.status === 'PENDING' ? 'Pending Manager Approval' : r.status}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: '0.85rem' }}>
                      {r.status === 'REJECTED' ? r.rejectionReason : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { fetchMe } from '../../api';
import { parseApiError } from '../../lib/parseApiError';
import {
  fetchLeaveRequests,
  fetchLeaveTypes,
  approveLeaveRequest,
  rejectLeaveRequest,
  requestMoreInfoOnLeave,
  type LeaveRequest,
  type LeaveType,
} from '../../payrollApi';

export function LeaveApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteState, setNoteState] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyByEmployee, setHistoryByEmployee] = useState<Record<string, LeaveRequest[]>>({});

  useEffect(() => {
    fetchMe().then((me) => setMyUserId(me.sub)).catch(() => {});
    fetchLeaveTypes().then(setLeaveTypes).catch(() => {});
  }, []);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, leaveTypeId, startDate, endDate, search]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const requests = await fetchLeaveRequests(undefined, undefined, {
        department: department || undefined,
        leaveTypeId: leaveTypeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
      });
      setLeaveRequests(requests);
    } catch (err: any) {
      console.error(err);
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHistory = async (employeeId: string) => {
    if (expandedId === employeeId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(employeeId);
    if (!historyByEmployee[employeeId]) {
      try {
        const history = await fetchLeaveRequests(undefined, employeeId);
        setHistoryByEmployee((prev) => ({ ...prev, [employeeId]: history }));
      } catch {
        setHistoryByEmployee((prev) => ({ ...prev, [employeeId]: [] }));
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveLeaveRequest(id, noteState[id]);
      await loadRequests();
    } catch (err: any) {
      setError(parseApiError(err).message);
    }
  };

  const handleReject = async (id: string) => {
    if (!noteState[id]) {
      setError('Please enter a rejection reason in the comment field first.');
      return;
    }
    try {
      await rejectLeaveRequest(id, noteState[id]);
      await loadRequests();
    } catch (err: any) {
      setError(parseApiError(err).message);
    }
  };

  const handleRequestInfo = async (id: string) => {
    if (!noteState[id]) {
      setError('Please enter what information is needed in the comment field first.');
      return;
    }
    try {
      await requestMoreInfoOnLeave(id, noteState[id]);
      setNoteState((prev) => ({ ...prev, [id]: '' }));
      setError(null);
    } catch (err: any) {
      setError(parseApiError(err).message);
    }
  };

  const departments = useMemo(
    () =>
      Array.from(
        new Set(leaveRequests.map((r) => r.employee?.department).filter((d): d is string => !!d)),
      ).sort(),
    [leaveRequests],
  );

  const filteredRequests = leaveRequests.filter((r) =>
    filterStatus === 'ALL' ? true : r.status === filterStatus,
  );

  const pendingCount = leaveRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="rec-page" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="muted">Loading leave approvals…</p>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Leave Approvals & Review</h1>
          <p className="muted">Review, approve, or reject employee leave applications.</p>
        </div>
      </div>

      {error && <div className="alert alert--err">{error}</div>}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--warning, #f59e0b)' }}>
          <div className="muted" style={{ fontSize: '0.85rem' }}>Pending Review</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.2rem 0' }}>{pendingCount}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--success, #10b981)' }}>
          <div className="muted" style={{ fontSize: '0.85rem' }}>Approved</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.2rem 0' }}>{approvedCount}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger, #ef4444)' }}>
          <div className="muted" style={{ fontSize: '0.85rem' }}>Rejected</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.2rem 0' }}>{rejectedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="text"
          className="auth-input"
          placeholder="Search employee name/email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="auth-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="auth-input" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
          <option value="">All leave types</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input type="date" className="auth-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="From date" />
        <input type="date" className="auth-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} title="To date" />
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
          <button
            key={st}
            className={`btn ${filterStatus === st ? 'btn--primary' : 'btn--ghost'} small`}
            onClick={() => setFilterStatus(st)}
          >
            {st === 'PENDING' ? `Pending (${pendingCount})` : st}
          </button>
        ))}
      </div>

      {/* Approvals Table */}
      <section className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Attachment</th>
                <th>Approver</th>
                <th>Action Comment</th>
                <th>Status / Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                    No leave requests found for status "{filterStatus}".
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <>
                    <tr key={r.id}>
                      <td>
                        <button
                          className="btn btn--ghost small"
                          style={{ padding: '0.1rem 0.4rem', marginRight: '0.35rem' }}
                          onClick={() => toggleHistory(r.employeeId)}
                          title="Show previous leave history"
                        >
                          {expandedId === r.employeeId ? '▾' : '▸'}
                        </button>
                        <strong>{r.employee?.firstName} {r.employee?.lastName}</strong>
                        <div className="muted" style={{ fontSize: '0.75rem' }}>{r.employee?.email}</div>
                      </td>
                      <td className="muted">{r.employee?.department || '—'}</td>
                      <td><span className="badge badge--gray">{r.leaveType?.name}</span></td>
                      <td>
                        {new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td><strong>{r.numberOfDays}</strong></td>
                      <td className="muted">{r.reason || '—'}</td>
                      <td>
                        {r.attachmentUrl ? (
                          <a href={r.attachmentUrl} target="_blank" rel="noreferrer">📎 View</a>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="muted" style={{ fontSize: '0.8rem' }}>
                        {r.approvedById ? (myUserId === r.approvedById ? 'You' : r.approvedById.slice(0, 8)) : '—'}
                      </td>
                      <td>
                        {r.status === 'PENDING' ? (
                          <input
                            type="text"
                            placeholder="Optional note / reason..."
                            className="auth-input"
                            style={{ margin: 0, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                            value={noteState[r.id] || ''}
                            onChange={(e) => setNoteState({ ...noteState, [r.id]: e.target.value })}
                          />
                        ) : (
                          <span className="muted" style={{ fontSize: '0.85rem' }}>
                            {r.rejectionReason || 'Reviewed'}
                          </span>
                        )}
                      </td>
                      <td>
                        {r.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button className="btn btn--success small" onClick={() => handleApprove(r.id)}>
                              Approve
                            </button>
                            <button className="btn btn--danger small" onClick={() => handleReject(r.id)}>
                              Reject
                            </button>
                            <button className="btn btn--ghost small" onClick={() => handleRequestInfo(r.id)}>
                              Request Info
                            </button>
                          </div>
                        ) : (
                          <span className={`badge ${
                            r.status === 'APPROVED' ? 'badge--green' : 'badge--red'
                          }`}>
                            {r.status}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedId === r.employeeId && (
                      <tr key={`${r.id}-history`}>
                        <td colSpan={10} style={{ background: 'var(--surface)', padding: '0.75rem 1rem' }}>
                          <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                            Previous leave history for {r.employee?.firstName} {r.employee?.lastName}
                          </div>
                          {!historyByEmployee[r.employeeId] ? (
                            <span className="muted" style={{ fontSize: '0.85rem' }}>Loading…</span>
                          ) : historyByEmployee[r.employeeId].length === 0 ? (
                            <span className="muted" style={{ fontSize: '0.85rem' }}>No other leave history.</span>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
                              {historyByEmployee[r.employeeId].map((h) => (
                                <li key={h.id}>
                                  {h.leaveType?.name}: {new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()} ({h.numberOfDays} days) — {h.status}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

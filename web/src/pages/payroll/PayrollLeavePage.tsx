import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  approveLeaveRequest,
  createLeaveRequest,
  fetchEmployees,
  fetchLeaveRequests,
  fetchLeaveTypes,
  rejectLeaveRequest,
  type Employee,
  type LeaveRequest,
  type LeaveType,
} from '../../payrollApi';

export function PayrollLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [reqs, leaveTypes, emps] = await Promise.all([
        fetchLeaveRequests(),
        fetchLeaveTypes(),
        fetchEmployees(),
      ]);
      setRequests(reqs);
      setTypes(leaveTypes);
      setEmployees(emps);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await createLeaveRequest({
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async (id: string) => {
    setBusy(true);
    try {
      await approveLeaveRequest(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onReject = async (id: string) => {
    setBusy(true);
    try {
      await rejectLeaveRequest(id);
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
          <h1 className="rec-page__title">Leave management</h1>
          <p className="rec-page__sub">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New request'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Employee
                <select className="auth-input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label rec-form__label--full">
                Leave type
                <select className="auth-input" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} required>
                  <option value="">Select type</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">Start *<input className="auth-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label>
              <label className="rec-form__label">End *<input className="auth-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></label>
              <label className="rec-form__label rec-form__label--full">Reason<textarea className="auth-input rec-textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : req.employeeId}</td>
                  <td>{req.leaveType?.name ?? req.leaveTypeId}</td>
                  <td>{req.startDate.slice(0, 10)} → {req.endDate.slice(0, 10)}</td>
                  <td>{req.days}</td>
                  <td>{req.status}</td>
                  <td>
                    {req.status === 'PENDING' && (
                      <>
                        <button type="button" className="btn btn--primary small" disabled={busy} onClick={() => onApprove(req.id)}>Approve</button>{' '}
                        <button type="button" className="btn btn--ghost small" disabled={busy} onClick={() => onReject(req.id)}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

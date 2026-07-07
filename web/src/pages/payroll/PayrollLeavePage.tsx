import { useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  fetchLeaveTypes,
  fetchLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  fetchLeaveBalances,
  fetchEmployees,
  type LeaveType,
  type LeaveRequest,
} from '../../payrollApi';

export function PayrollLeavePage() {
  const [me, setMe] = useState<any>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Approval Note State
  const [noteState, setNoteState] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await fetchMe();
      setMe(user);

      const types = await fetchLeaveTypes();
      setLeaveTypes(types);

      const requests = await fetchLeaveRequests();
      setLeaveRequests(requests);

      const empList = await fetchEmployees();
      setEmployees(empList);

      // Find the employee ID corresponding to current user's email
      const matchedEmp = empList.find((e) => e.email.toLowerCase() === user.email.toLowerCase());
      const empId = matchedEmp?.id;

      if (empId) {
        setFormData((prev) => ({ ...prev, employeeId: empId }));
        const balances = await fetchLeaveBalances(empId);
        setLeaveBalances(balances);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.leaveTypeId || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await createLeaveRequest({
        employeeId: formData.employeeId,
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });
      setShowModal(false);
      setFormData((prev) => ({ ...prev, leaveTypeId: '', startDate: '', endDate: '', reason: '' }));
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveLeaveRequest(id, noteState[id]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    if (!noteState[id]) {
      alert('Please enter a rejection reason in the comment field first');
      return;
    }
    try {
      await rejectLeaveRequest(id, noteState[id]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const isHR = me?.roles?.includes('HR_MANAGER') || me?.roles?.includes('TENANT_ADMIN');

  if (loading) {
    return (
      <div className="rec-page text-center" style={{ padding: '3rem' }}>
        <div className="spinner">Loading leave data...</div>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="rec-page__title">Leave Management</h1>
          <p className="muted">Track leave balances, submit requests, and manage approvals.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          + Request Leave
        </button>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}

      {/* Leave Balances Grid */}
      <section className="mb-8">
        <h2 className="section-title mb-4">Your Leave Balances ({new Date().getFullYear()})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {leaveBalances.length === 0 ? (
            <div className="card text-center text-muted" style={{ gridColumn: '1/-1', padding: '1.5rem' }}>
              No leave balances initialized. Try requesting a leave or ensure you are set up as an employee.
            </div>
          ) : (
            leaveBalances.map((b) => {
              const remaining = Number(b.allocatedDays) - Number(b.usedDays);
              return (
                <div className="card" key={b.id} style={{ borderLeft: `4px solid var(--primary-color, #00466c)` }}>
                  <div className="muted font-semibold" style={{ fontSize: '0.9rem' }}>{b.leaveType?.name}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {remaining} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>days left</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Allocated: {b.allocatedDays} | Used: {b.usedDays}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Approvals Section for HR / Managers */}
      {isHR && (
        <section className="card mb-8">
          <h2 className="card-title mb-4">Pending Approvals (HR / Admin)</h2>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Action Comment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.filter((r) => r.status === 'PENDING').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">No pending leave requests to review.</td>
                  </tr>
                ) : (
                  leaveRequests
                    .filter((r) => r.status === 'PENDING')
                    .map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.employee?.firstName} {r.employee?.lastName}</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.employee?.email}</div>
                        </td>
                        <td><span className="badge badge--neutral">{r.leaveType?.name}</span></td>
                        <td>
                          {new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()}
                        </td>
                        <td>{r.numberOfDays}</td>
                        <td className="text-muted">{r.reason || 'N/A'}</td>
                        <td>
                          <input
                            type="text"
                            placeholder="Add reason/note..."
                            className="auth-input"
                            style={{ margin: 0, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                            value={noteState[r.id] || ''}
                            onChange={(e) => setNoteState({ ...noteState, [r.id]: e.target.value })}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn--success btn--sm" onClick={() => handleApprove(r.id)}>
                              Approve
                            </button>
                            <button className="btn btn--danger btn--sm" onClick={() => handleReject(r.id)}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Requests History */}
      <section className="card">
        <h2 className="card-title mb-4">Request History</h2>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Notes / Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">No leave requests found.</td>
                </tr>
              ) : (
                leaveRequests.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.leaveType?.name}</strong></td>
                    <td>
                      {new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td>{r.numberOfDays}</td>
                    <td className="text-muted">{r.reason || 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        r.status === 'APPROVED'
                          ? 'badge--active'
                          : r.status === 'REJECTED'
                            ? 'badge--danger'
                            : 'badge--warning'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {r.status === 'REJECTED' ? r.rejectionReason : 'Approved'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Request Leave Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '500px', padding: '2rem' }}>
            <h3 className="modal-title mb-4">Request Leave</h3>
            <form onSubmit={handleCreateRequest}>
              <div className="mb-4">
                <label className="rec-form__label">Employee ID (Self)</label>
                <select
                  className="auth-input"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                >
                  <option value="">Select Employee profile</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="rec-form__label">Leave Type</label>
                <select
                  className="auth-input"
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (default {t.defaultDays} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="rec-form__label">Start Date</label>
                  <input
                    type="date"
                    className="auth-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="rec-form__label">End Date</label>
                  <input
                    type="date"
                    className="auth-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="rec-form__label">Reason</label>
                <textarea
                  className="auth-input"
                  style={{ minHeight: '80px' }}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Optional context for your request..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn--neutral" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

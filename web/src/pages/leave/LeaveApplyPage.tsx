import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseApiError } from '../../lib/parseApiError';
import {
  fetchLeaveTypes,
  fetchEmployees,
  fetchMyEmployee,
  createLeaveRequest,
  uploadLeaveAttachment,
  type LeaveType,
  type Employee,
} from '../../payrollApi';

function calculateWorkingDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function LeaveApplyPage() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    delegateToEmployeeId: '',
    emergencyContactPhone: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [types, matchedEmp] = await Promise.all([fetchLeaveTypes(), fetchMyEmployee()]);
        setLeaveTypes(types);
        if (matchedEmp) {
          setFormData((prev) => ({ ...prev, employeeId: matchedEmp.id }));
        }
        try {
          // Listing all employees requires HR/admin privileges — used here only to populate
          // the "delegate to" picker. A plain employee without that access can still submit
          // their own request; the delegate picker just falls back to themselves alone.
          setEmployees(await fetchEmployees());
        } catch {
          setEmployees(matchedEmp ? [matchedEmp] : []);
        }
      } catch (err) {
        setLoadError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const workingDays = calculateWorkingDays(formData.startDate, formData.endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.employeeId || !formData.leaveTypeId || !formData.startDate || !formData.endDate) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot be before start date.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await createLeaveRequest({
        employeeId: formData.employeeId,
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        delegateToEmployeeId: formData.delegateToEmployeeId || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
      });

      if (attachment) {
        try {
          await uploadLeaveAttachment(created.id, attachment);
        } catch {
          // Non-fatal: the request itself was created successfully.
        }
      }

      navigate('/leave/requests', { state: { submitted: true } });
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rec-page" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Apply for Leave</h1>
          <p className="muted">Submit a new time-off request for approval.</p>
        </div>
      </div>

      {loadError && <div className="alert alert--err">{loadError}</div>}

      <section className="card" style={{ maxWidth: 640 }}>
        {formError && <div className="alert alert--err">{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="rec-form__label">Employee Profile</label>
            <select
              className="auth-input"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="rec-form__label">Leave Category</label>
            <select
              className="auth-input"
              value={formData.leaveTypeId}
              onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
              required
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.defaultDays} default days)
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '0.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
          {formData.startDate && formData.endDate && (
            <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              {workingDays > 0
                ? `${workingDays} working day${workingDays === 1 ? '' : 's'} (weekends excluded)`
                : 'End date must be on or after the start date.'}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label className="rec-form__label">Reason for Request</label>
            <textarea
              className="auth-input"
              style={{ minHeight: '80px' }}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide context for your manager / HR..."
            />
          </div>

          <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="rec-form__label">Delegate Work To</label>
              <select
                className="auth-input"
                value={formData.delegateToEmployeeId}
                onChange={(e) => setFormData({ ...formData, delegateToEmployeeId: e.target.value })}
              >
                <option value="">None</option>
                {employees.filter((e) => e.id !== formData.employeeId).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="rec-form__label">Emergency Contact</label>
              <input
                type="tel"
                className="auth-input"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="rec-form__label">Attachment (optional)</label>
            <input
              type="file"
              className="auth-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
            <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
              e.g. medical certificate, approval letter, supporting documents.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn--ghost" onClick={() => navigate('/leave')}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

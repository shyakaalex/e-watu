import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  fetchPips, createPip, updatePip, addPipCheckIn,
  fetchEmployees,
  type PerformanceImprovementPlan, type PipStatus,
} from '../../payrollApi';

const STATUS_LABELS: Record<PipStatus, string> = {
  ACTIVE: 'Active', EXTENDED: 'Extended', SUCCEEDED: 'Succeeded',
  ESCALATED: 'Escalated', CLOSED: 'Closed',
};
const STATUS_CLASS: Record<PipStatus, string> = {
  ACTIVE: 'badge badge--warning', EXTENDED: 'badge badge--info',
  SUCCEEDED: 'badge badge--active', ESCALATED: 'badge badge--danger',
  CLOSED: 'badge badge--muted',
};

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function ReviewBadge({ reviewDate, status }: { reviewDate: string; status: PipStatus }) {
  if (status !== 'ACTIVE' && status !== 'EXTENDED') {
    return <span className="muted">{new Date(reviewDate).toLocaleDateString()}</span>;
  }
  const days = daysUntil(reviewDate);
  if (days === null) return <span className="muted">—</span>;
  if (days < 0) return <span className="badge badge--danger">Review overdue</span>;
  if (days <= 7) return <span className="badge badge--danger">{days}d to review</span>;
  if (days <= 21) return <span className="badge badge--warning">{days}d to review</span>;
  return <span className="muted">{new Date(reviewDate).toLocaleDateString()}</span>;
}

const INIT_FORM = {
  employeeId: '', reason: '', objectives: '', supportProvided: '',
  startDate: '', reviewDate: '',
};

export function PerformanceImprovementPlansPage() {
  const [pips, setPips] = useState<PerformanceImprovementPlan[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT_FORM);

  const [selected, setSelected] = useState<PerformanceImprovementPlan | null>(null);
  const [checkInNote, setCheckInNote] = useState('');
  const [closeOutcome, setCloseOutcome] = useState('');
  const [closeStatus, setCloseStatus] = useState<PipStatus>('SUCCEEDED');

  const f = (k: keyof typeof INIT_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [list, emps] = await Promise.all([
        fetchPips(undefined, statusFilter === 'ALL' ? undefined : statusFilter),
        fetchEmployees(),
      ]);
      setPips(list);
      setEmployees(Array.isArray(emps) ? emps : (emps as any).data ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      await createPip({
        employeeId: form.employeeId,
        reason: form.reason,
        objectives: form.objectives,
        supportProvided: form.supportProvided || undefined,
        startDate: form.startDate,
        reviewDate: form.reviewDate,
      });
      setShowForm(false); setForm(INIT_FORM); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const openDetail = (p: PerformanceImprovementPlan) => {
    setSelected(p); setCheckInNote(''); setCloseOutcome(''); setCloseStatus('SUCCEEDED');
  };

  const submitCheckIn = async () => {
    if (!selected || !checkInNote.trim()) return;
    setBusy(true);
    try {
      await addPipCheckIn(selected.id, { note: checkInNote });
      setCheckInNote('');
      const refreshed = await fetchPips();
      const next = refreshed.find((p) => p.id === selected.id) ?? null;
      setSelected(next);
      setPips(refreshed);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const closePlan = async () => {
    if (!selected) return; setBusy(true);
    try {
      await updatePip(selected.id, {
        status: closeStatus,
        outcome: closeOutcome || undefined,
        endDate: new Date().toISOString().slice(0, 10),
      });
      setSelected(null); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const activeCount = pips.filter((p) => p.status === 'ACTIVE' || p.status === 'EXTENDED').length;
  const overdueCount = pips.filter((p) => (p.status === 'ACTIVE' || p.status === 'EXTENDED') && (daysUntil(p.reviewDate) ?? 0) < 0).length;

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Performance Improvement Plans</h1>
          <p className="rec-page__sub">{activeCount} active · {overdueCount} overdue for review</p>
        </div>
        <div className="rec-page__actions">
          <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ New PIP'}
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      <div className="rec-page__actions" style={{ marginBottom: '1rem' }}>
        {(['ALL', ...Object.keys(STATUS_LABELS)] as const).map((s) => (
          <button key={s} type="button" className={`btn btn--sm${statusFilter === s ? ' btn--primary' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'ALL' ? 'All' : STATUS_LABELS[s as PipStatus]}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card rec-form-card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>New performance improvement plan</h3>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Employee <span className="rec-form__req">*</span>
                <select className="auth-input" value={form.employeeId} onChange={f('employeeId')} required>
                  <option value="">Select…</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
              <label className="rec-form__label rec-form__label--full">Reason for PIP <span className="rec-form__req">*</span>
                <input className="auth-input" value={form.reason} onChange={f('reason')} placeholder="e.g. Missed quarterly delivery targets" required />
              </label>
              <label className="rec-form__label rec-form__label--full">Improvement objectives <span className="rec-form__req">*</span>
                <textarea className="auth-input" rows={3} value={form.objectives} onChange={f('objectives')} placeholder="What must the employee achieve to succeed on this plan?" required />
              </label>
              <label className="rec-form__label rec-form__label--full">Support provided
                <input className="auth-input" value={form.supportProvided} onChange={f('supportProvided')} placeholder="e.g. Weekly coaching with manager, training budget" />
              </label>
              <label className="rec-form__label">Start date <span className="rec-form__req">*</span><input className="auth-input" type="date" value={form.startDate} onChange={f('startDate')} required /></label>
              <label className="rec-form__label">Review date <span className="rec-form__req">*</span><input className="auth-input" type="date" value={form.reviewDate} onChange={f('reviewDate')} required /></label>
            </div>
            <div className="rec-form__actions">
              <button className="btn" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create PIP'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="muted">Loading…</p> : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead><tr><th>Employee</th><th>Reason</th><th>Start</th><th>Review</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {pips.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>No improvement plans found</td></tr>}
              {pips.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.employee?.firstName} {p.employee?.lastName}</strong>{p.employee?.jobTitle && <div className="muted" style={{ fontSize: '0.8rem' }}>{p.employee.jobTitle}</div>}</td>
                  <td>{p.reason}</td>
                  <td>{new Date(p.startDate).toLocaleDateString()}</td>
                  <td><ReviewBadge reviewDate={p.reviewDate} status={p.status} /></td>
                  <td><span className={STATUS_CLASS[p.status]}>{STATUS_LABELS[p.status]}</span></td>
                  <td><button className="btn btn--sm" onClick={() => openDetail(p)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="rec-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="rec-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.25rem' }}>{selected.employee?.firstName} {selected.employee?.lastName}</h3>
            <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.875rem' }}>
              <span className={STATUS_CLASS[selected.status]}>{STATUS_LABELS[selected.status]}</span>
              {' · '}Started {new Date(selected.startDate).toLocaleDateString()}
              {' · '}Review {new Date(selected.reviewDate).toLocaleDateString()}
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Reason</div>
              <p style={{ margin: '0.15rem 0 0.6rem', fontSize: '0.9rem' }}>{selected.reason}</p>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Objectives</div>
              <p style={{ margin: '0.15rem 0 0.6rem', fontSize: '0.9rem' }}>{selected.objectives}</p>
              {selected.supportProvided && (
                <>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Support provided</div>
                  <p style={{ margin: '0.15rem 0 0.6rem', fontSize: '0.9rem' }}>{selected.supportProvided}</p>
                </>
              )}
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Progress check-ins</div>
            <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '0.75rem' }}>
              {(selected.checkIns ?? []).length === 0 && <p className="muted" style={{ fontSize: '0.85rem' }}>No check-ins logged yet.</p>}
              {(selected.checkIns ?? []).map((c) => (
                <div key={c.id} style={{ borderLeft: '3px solid var(--brand)', paddingLeft: '0.75rem', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{new Date(c.createdAt).toLocaleString()}</div>
                  <div style={{ fontSize: '0.85rem' }}>{c.note}</div>
                </div>
              ))}
            </div>

            {(selected.status === 'ACTIVE' || selected.status === 'EXTENDED') && (
              <>
                <div className="rec-form" style={{ marginBottom: '1rem' }}>
                  <label className="rec-form__label">Add check-in note
                    <input className="auth-input" value={checkInNote} onChange={(e) => setCheckInNote(e.target.value)} placeholder="Progress update…" />
                  </label>
                  <div className="rec-form__actions">
                    <button className="btn" type="button" disabled={busy || !checkInNote.trim()} onClick={submitCheckIn}>Log check-in</button>
                  </div>
                </div>

                <div className="rec-form" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                  <label className="rec-form__label">Close plan as
                    <select className="auth-input" value={closeStatus} onChange={(e) => setCloseStatus(e.target.value as PipStatus)}>
                      <option value="SUCCEEDED">Succeeded — objectives met</option>
                      <option value="ESCALATED">Escalated — no improvement</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </label>
                  <label className="rec-form__label">Outcome notes
                    <input className="auth-input" value={closeOutcome} onChange={(e) => setCloseOutcome(e.target.value)} />
                  </label>
                  <div className="rec-form__actions">
                    <button className="btn" type="button" onClick={() => setSelected(null)}>Cancel</button>
                    <button className="btn btn--primary" type="button" disabled={busy} onClick={closePlan}>{busy ? 'Saving…' : 'Close plan'}</button>
                  </div>
                </div>
              </>
            )}
            {selected.status !== 'ACTIVE' && selected.status !== 'EXTENDED' && (
              <div className="rec-form__actions"><button className="btn btn--primary" onClick={() => setSelected(null)}>Close</button></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

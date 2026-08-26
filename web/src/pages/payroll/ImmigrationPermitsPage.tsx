import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  fetchPermits, createPermit, updatePermitChecklistItem,
  fetchEmployees,
  type Permit, type PermitType, type ChecklistItemStatus,
} from '../../payrollApi';

const TYPE_LABELS: Record<PermitType, string> = {
  WORK_PERMIT: 'Work Permit', VISA: 'Visa', RESIDENCE_PERMIT: 'Residence Permit',
};
const STATUS_CLASS: Record<Permit['status'], string> = {
  APPROVED: 'badge badge--active', EXPIRED: 'badge badge--danger', REVOKED: 'badge badge--muted',
};
const CHECKLIST_LABELS: Record<ChecklistItemStatus, string> = {
  PENDING: 'Pending', UPLOADED: 'Uploaded', VERIFIED: 'Verified',
};
const CHECKLIST_CLASS: Record<ChecklistItemStatus, string> = {
  PENDING: 'badge badge--muted', UPLOADED: 'badge badge--info', VERIFIED: 'badge badge--active',
};

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function ExpiryBadge({ expiryDate, status }: { expiryDate: string; status: Permit['status'] }) {
  if (status !== 'APPROVED') return <span className="muted">{new Date(expiryDate).toLocaleDateString()}</span>;
  const days = daysUntil(expiryDate);
  if (days < 0) return <span className="badge badge--danger">Expired</span>;
  if (days <= 30) return <span className="badge badge--danger">{days}d left</span>;
  if (days <= 60) return <span className="badge badge--warning">{days}d left</span>;
  if (days <= 90) return <span className="badge badge--info">{days}d left</span>;
  return <span className="muted">{new Date(expiryDate).toLocaleDateString()}</span>;
}

const INIT_FORM = {
  employeeId: '', permitNumber: '', permitType: 'WORK_PERMIT' as PermitType,
  country: 'RW', expiryDate: '',
};

export function ImmigrationPermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [selected, setSelected] = useState<Permit | null>(null);

  const f = (k: keyof typeof INIT_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [list, emps] = await Promise.all([
        fetchPermits(statusFilter === 'ALL' ? undefined : statusFilter),
        fetchEmployees(),
      ]);
      setPermits(list);
      setEmployees(Array.isArray(emps) ? emps : (emps as any).data ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      await createPermit({
        employeeId: form.employeeId,
        permitNumber: form.permitNumber,
        permitType: form.permitType,
        country: form.country || undefined,
        expiryDate: form.expiryDate,
      });
      setShowForm(false); setForm(INIT_FORM); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const openDetail = async (p: Permit) => setSelected(p);

  const cycleChecklistStatus = async (permitId: string, itemId: string, current: ChecklistItemStatus) => {
    const next: ChecklistItemStatus = current === 'PENDING' ? 'UPLOADED' : current === 'UPLOADED' ? 'VERIFIED' : 'PENDING';
    setBusy(true);
    try {
      await updatePermitChecklistItem(permitId, itemId, { status: next });
      const refreshed = await fetchPermits();
      setPermits(refreshed);
      setSelected(refreshed.find((p) => p.id === permitId) ?? null);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const expiring90 = permits.filter((p) => p.status === 'APPROVED' && daysUntil(p.expiryDate) <= 90).length;

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Work Permits & Immigration</h1>
          <p className="rec-page__sub">{permits.length} cases · {expiring90} expiring within 90 days</p>
        </div>
        <div className="rec-page__actions">
          <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ New permit case'}
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      <div className="rec-page__actions" style={{ marginBottom: '1rem' }}>
        {(['ALL', 'APPROVED', 'EXPIRED', 'REVOKED'] as const).map((s) => (
          <button key={s} type="button" className={`btn btn--sm${statusFilter === s ? ' btn--primary' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card rec-form-card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>New permit / visa case</h3>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Employee <span className="rec-form__req">*</span>
                <select className="auth-input" value={form.employeeId} onChange={f('employeeId')} required>
                  <option value="">Select…</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
              <label className="rec-form__label">Permit / visa number <span className="rec-form__req">*</span>
                <input className="auth-input" value={form.permitNumber} onChange={f('permitNumber')} required />
              </label>
              <label className="rec-form__label">Type
                <select className="auth-input" value={form.permitType} onChange={f('permitType')}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="rec-form__label">Country<input className="auth-input" value={form.country} onChange={f('country')} placeholder="RW" /></label>
              <label className="rec-form__label">Expiry date <span className="rec-form__req">*</span><input className="auth-input" type="date" value={form.expiryDate} onChange={f('expiryDate')} required /></label>
            </div>
            <p className="muted" style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>A document checklist is generated automatically based on the type and country selected.</p>
            <div className="rec-form__actions">
              <button className="btn" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create case'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="muted">Loading…</p> : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead><tr><th>Employee</th><th>Type</th><th>Permit #</th><th>Country</th><th>Expiry</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {permits.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>No permit cases found</td></tr>}
              {permits.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.employee?.firstName} {p.employee?.lastName}</strong></td>
                  <td><span className="badge badge--muted">{TYPE_LABELS[p.permitType]}</span></td>
                  <td>{p.permitNumber}</td>
                  <td>{p.country}</td>
                  <td><ExpiryBadge expiryDate={p.expiryDate} status={p.status} /></td>
                  <td><span className={STATUS_CLASS[p.status]}>{p.status}</span></td>
                  <td><button className="btn btn--sm" onClick={() => openDetail(p)}>Checklist ({p.checklistItems?.length ?? 0})</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="rec-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="rec-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.25rem' }}>{selected.employee?.firstName} {selected.employee?.lastName}</h3>
            <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.875rem' }}>
              {TYPE_LABELS[selected.permitType]} · {selected.permitNumber} · Expires {new Date(selected.expiryDate).toLocaleDateString()}
            </p>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Document checklist</div>
            {(selected.checklistItems ?? []).map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.88rem' }}>{item.documentName}</span>
                <button
                  className={CHECKLIST_CLASS[item.status]}
                  style={{ border: 'none', cursor: 'pointer' }}
                  disabled={busy}
                  onClick={() => cycleChecklistStatus(selected.id, item.id, item.status)}
                  title="Click to advance status"
                >
                  {CHECKLIST_LABELS[item.status]}
                </button>
              </div>
            ))}
            <div className="rec-form__actions" style={{ marginTop: '1.25rem' }}>
              <button className="btn btn--primary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

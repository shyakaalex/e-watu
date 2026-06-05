import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchOutsourcingAssignments, fetchOutsourcingBench,
  createOutsourcingAssignment, updateOutsourcingAssignment,
  fetchEmployees,
  type OutsourcingAssignment, type DeploymentStatus,
} from '../../payrollApi';

const STATUS_LABELS: Record<DeploymentStatus, string> = {
  ACTIVE: 'Active', ON_LEAVE: 'On Leave', RECALLED: 'Recalled',
  TRANSFERRED: 'Transferred', ON_BENCH: 'On Bench',
};
const STATUS_CLASS: Record<DeploymentStatus, string> = {
  ACTIVE: 'badge badge--active', ON_LEAVE: 'badge badge--warning',
  RECALLED: 'badge badge--warning', TRANSFERRED: 'badge badge--info',
  ON_BENCH: 'badge badge--muted',
};
const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time', FIXED_TERM: 'Fixed-term',
};

function ExpiryBadge({ endDate }: { endDate: string | null | undefined }) {
  if (!endDate) return <span className="muted">—</span>;
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="badge badge--danger">Expired</span>;
  if (days <= 30) return <span className="badge badge--danger">{days}d left</span>;
  if (days <= 60) return <span className="badge badge--warning">{days}d left</span>;
  if (days <= 90) return <span className="badge badge--info">{days}d left</span>;
  return <span className="muted">{new Date(endDate).toLocaleDateString()}</span>;
}

const INIT_FORM = {
  employeeId: '', clientName: '', roleName: '', deploymentSite: '',
  employmentType: 'FULL_TIME', startDate: '', endDate: '',
  monthlyFee: '', currency: 'RWF', noticePeriodDays: '30',
};

export function PayrollOutsourcingPage() {
  const [tab, setTab] = useState<'registry' | 'bench'>('registry');
  const [items, setItems] = useState<OutsourcingAssignment[]>([]);
  const [bench, setBench] = useState<OutsourcingAssignment[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [updating, setUpdating] = useState<OutsourcingAssignment | null>(null);
  const [newStatus, setNewStatus] = useState<DeploymentStatus>('ACTIVE');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [form, setForm] = useState(INIT_FORM);
  const f = (k: keyof typeof INIT_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (clientFilter.trim()) params.clientName = clientFilter;
      if (roleFilter.trim()) params.role = roleFilter;
      if (typeFilter !== 'ALL') params.employmentType = typeFilter;
      const [a, b, emps] = await Promise.all([
        fetchOutsourcingAssignments(params), fetchOutsourcingBench(), fetchEmployees(),
      ]);
      setItems(a); setBench(b);
      setEmployees(Array.isArray(emps) ? emps : (emps as any).data ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [statusFilter, clientFilter, roleFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      await createOutsourcingAssignment({
        employeeId: form.employeeId, clientName: form.clientName, roleName: form.roleName,
        deploymentSite: form.deploymentSite || undefined, employmentType: form.employmentType,
        startDate: form.startDate, endDate: form.endDate || undefined,
        monthlyFee: form.monthlyFee ? Number(form.monthlyFee) : undefined,
        currency: form.currency, noticePeriodDays: Number(form.noticePeriodDays),
      });
      setShowForm(false); setForm(INIT_FORM); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const saveStatus = async () => {
    if (!updating) return; setBusy(true);
    try {
      await updateOutsourcingAssignment(updating.id, {
        deploymentStatus: newStatus,
        ...(newStatus === 'ON_BENCH' && availabilityDate ? { availabilityDate } : {}),
      });
      setUpdating(null); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Outsourced Employee Registry</h1>
          <p className="rec-page__sub">{items.length} deployed · {bench.length} on bench</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/payroll/outsourcing/contracts" className="btn">Contracts</Link>
          <button className="btn btn--primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New assignment'}
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
        {(['registry', 'bench'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1.1rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === t ? '700' : '400', fontSize: '0.9rem',
            borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
            color: tab === t ? 'var(--brand)' : 'var(--ink-muted)',
          }}>
            {t === 'registry' ? `Registry (${items.length})` : `Bench (${bench.length})`}
          </button>
        ))}
      </div>

      {tab === 'registry' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <select className="auth-input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="auth-input" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="ALL">All types</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input className="auth-input" style={{ width: '150px' }} placeholder="Client…" value={clientFilter} onChange={e => setClientFilter(e.target.value)} />
          <input className="auth-input" style={{ width: '150px' }} placeholder="Role…" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} />
          <button className="btn" onClick={load}>Apply</button>
        </div>
      )}

      {showForm && (
        <div className="card rec-form-card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>New outsourcing assignment</h3>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Employee <span className="rec-form__req">*</span>
                <select className="auth-input" value={form.employeeId} onChange={f('employeeId')} required>
                  <option value="">Select…</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
              <label className="rec-form__label">Client <span className="rec-form__req">*</span><input className="auth-input" value={form.clientName} onChange={f('clientName')} required /></label>
              <label className="rec-form__label">Role <span className="rec-form__req">*</span><input className="auth-input" value={form.roleName} onChange={f('roleName')} required /></label>
              <label className="rec-form__label">Deployment site<input className="auth-input" value={form.deploymentSite} onChange={f('deploymentSite')} /></label>
              <label className="rec-form__label">Employment type
                <select className="auth-input" value={form.employmentType} onChange={f('employmentType')}>
                  <option value="FULL_TIME">Full-time outsourced</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="FIXED_TERM">Fixed-term contract</option>
                </select>
              </label>
              <label className="rec-form__label">Start date <span className="rec-form__req">*</span><input className="auth-input" type="date" value={form.startDate} onChange={f('startDate')} required /></label>
              <label className="rec-form__label">Contract end date<input className="auth-input" type="date" value={form.endDate} onChange={f('endDate')} /></label>
              <label className="rec-form__label">Monthly billing fee<input className="auth-input" type="number" min={0} value={form.monthlyFee} onChange={f('monthlyFee')} /></label>
              <label className="rec-form__label">Currency
                <select className="auth-input" value={form.currency} onChange={f('currency')}>
                  <option>RWF</option><option>USD</option><option>EUR</option>
                </select>
              </label>
              <label className="rec-form__label">Notice period (days)<input className="auth-input" type="number" min={0} value={form.noticePeriodDays} onChange={f('noticePeriodDays')} /></label>
            </div>
            <div className="rec-form__actions">
              <button className="btn" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create assignment'}</button>
            </div>
          </form>
        </div>
      )}

      {updating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setUpdating(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.75rem', width: '360px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.4rem' }}>Update deployment status</h3>
            <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.875rem' }}>{updating.employee?.firstName} {updating.employee?.lastName} — {updating.clientName}</p>
            <label className="rec-form__label">New status
              <select className="auth-input" value={newStatus} onChange={e => setNewStatus(e.target.value as DeploymentStatus)}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            {newStatus === 'ON_BENCH' && (
              <label className="rec-form__label" style={{ marginTop: '0.75rem' }}>Availability date<input className="auth-input" type="date" value={availabilityDate} onChange={e => setAvailabilityDate(e.target.value)} /></label>
            )}
            <div className="rec-form__actions" style={{ marginTop: '1.25rem' }}>
              <button className="btn" onClick={() => setUpdating(null)}>Cancel</button>
              <button className="btn btn--primary" onClick={saveStatus} disabled={busy}>{busy ? 'Saving…' : 'Save status'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p className="muted">Loading…</p> : tab === 'registry' ? (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead><tr><th>Employee</th><th>Client</th><th>Role / Site</th><th>Type</th><th>Status</th><th>Contract expiry</th><th>Fee</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={8} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>No assignments found</td></tr>}
              {items.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.employee?.firstName} {a.employee?.lastName}</strong><div className="muted" style={{ fontSize: '0.8rem' }}>{a.employee?.jobTitle}</div></td>
                  <td>{a.clientName}</td>
                  <td>{a.roleName}{a.deploymentSite && <div className="muted" style={{ fontSize: '0.8rem' }}>📍 {a.deploymentSite}</div>}</td>
                  <td><span className="badge badge--muted">{TYPE_LABELS[a.employmentType]}</span></td>
                  <td><span className={STATUS_CLASS[a.deploymentStatus]}>{STATUS_LABELS[a.deploymentStatus]}</span></td>
                  <td><ExpiryBadge endDate={a.contracts?.[0]?.endDate ?? a.endDate} /></td>
                  <td>{a.monthlyFee ? `${a.monthlyFee} ${a.currency}` : '—'}</td>
                  <td><button className="btn btn--sm" onClick={() => { setUpdating(a); setNewStatus(a.deploymentStatus); setAvailabilityDate(''); }}>Status</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : bench.length === 0 ? <p className="muted">No employees currently on bench.</p> : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead><tr><th>Employee</th><th>Last client</th><th>Role</th><th>Available from</th><th></th></tr></thead>
            <tbody>
              {bench.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.employee?.firstName} {a.employee?.lastName}</strong><div className="muted" style={{ fontSize: '0.8rem' }}>{a.employee?.email}</div></td>
                  <td>{a.clientName}</td>
                  <td>{a.roleName}</td>
                  <td>{a.availabilityDate ? new Date(a.availabilityDate).toLocaleDateString() : '—'}</td>
                  <td><button className="btn btn--sm btn--primary" onClick={() => { setUpdating(a); setNewStatus('ACTIVE'); setAvailabilityDate(''); }}>Deploy</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

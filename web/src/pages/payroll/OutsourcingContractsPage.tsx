import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  fetchSecondmentContracts, createSecondmentContract, updateSecondmentContract,
  terminateSecondmentContract, renewSecondmentContract, fetchContractAmendments,
  fetchOutsourcingAssignments,
  type SecondmentContract, type ContractAmendment, type SecondmentContractStatus,
} from '../../payrollApi';

const STATUS_CLASS: Record<SecondmentContractStatus, string> = {
  ACTIVE: 'badge badge--active', EXPIRED: 'badge badge--danger',
  TERMINATED: 'badge badge--danger', RENEWED: 'badge badge--info',
};

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function ExpiryCell({ endDate, alert30, alert60, alert90 }: { endDate: string | null; alert30: boolean; alert60: boolean; alert90: boolean }) {
  const days = daysUntil(endDate);
  if (!endDate) return <span className="muted">Open-ended</span>;
  const dateStr = new Date(endDate).toLocaleDateString();
  if (days === null) return <span>{dateStr}</span>;
  if (days < 0) return <><span className="badge badge--danger">Expired</span> <span className="muted" style={{ fontSize: '0.8rem' }}>{dateStr}</span></>;
  if (days <= 30) return <><span className="badge badge--danger">⚠ {days}d</span> <span className="muted" style={{ fontSize: '0.8rem' }}>{dateStr}</span></>;
  if (days <= 60) return <><span className="badge badge--warning">{days}d</span> <span className="muted" style={{ fontSize: '0.8rem' }}>{dateStr}</span></>;
  if (days <= 90) return <><span className="badge badge--info">{days}d</span> <span className="muted" style={{ fontSize: '0.8rem' }}>{dateStr}</span></>;
  return <span>{dateStr}</span>;
}

export function OutsourcingContractsPage() {
  const [contracts, setContracts] = useState<SecondmentContract[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);

  // Selected contract for actions
  const [selected, setSelected] = useState<SecondmentContract | null>(null);
  const [modal, setModal] = useState<'amend' | 'terminate' | 'renew' | 'log' | null>(null);
  const [amendments, setAmendments] = useState<ContractAmendment[]>([]);

  // Forms
  const [amendForm, setAmendForm] = useState({ billingRate: '', endDate: '', role: '', noticePeriodDays: '', reason: '' });
  const [terminateForm, setTerminateForm] = useState({ reason: '', terminationDate: '' });
  const [renewForm, setRenewForm] = useState({ newEndDate: '', billingRate: '', notes: '' });
  const [newContractForm, setNewContractForm] = useState({
    assignmentId: '', contractRef: '', clientName: '', role: '', billingRate: '',
    currency: 'RWF', workingHoursPerWeek: '40', noticePeriodDays: '30',
    governingLaw: '', startDate: '', endDate: '', renewalDate: '',
  });

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const [c, a] = await Promise.all([fetchSecondmentContracts(params), fetchOutsourcingAssignments()]);
      setContracts(c); setAssignments(a);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAmendmentLog = async (c: SecondmentContract) => {
    setSelected(c); setBusy(true);
    try { setAmendments(await fetchContractAmendments(c.id)); setModal('log'); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const submitAmend = async (e: FormEvent) => {
    e.preventDefault(); if (!selected) return; setBusy(true);
    try {
      await updateSecondmentContract(selected.id, {
        billingRate: amendForm.billingRate ? Number(amendForm.billingRate) : undefined,
        endDate: amendForm.endDate || undefined,
        role: amendForm.role || undefined,
        noticePeriodDays: amendForm.noticePeriodDays ? Number(amendForm.noticePeriodDays) : undefined,
        amendmentReason: amendForm.reason,
      });
      closeModal(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const submitTerminate = async (e: FormEvent) => {
    e.preventDefault(); if (!selected) return; setBusy(true);
    try {
      await terminateSecondmentContract(selected.id, { reason: terminateForm.reason, terminationDate: terminateForm.terminationDate || undefined });
      closeModal(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const submitRenew = async (e: FormEvent) => {
    e.preventDefault(); if (!selected) return; setBusy(true);
    try {
      await renewSecondmentContract(selected.id, {
        newEndDate: renewForm.newEndDate,
        billingRate: renewForm.billingRate ? Number(renewForm.billingRate) : undefined,
        notes: renewForm.notes || undefined,
      });
      closeModal(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const submitNewContract = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const selected = assignments.find(a => a.id === newContractForm.assignmentId);
      await createSecondmentContract({
        assignmentId: newContractForm.assignmentId,
        contractRef: newContractForm.contractRef || undefined,
        clientName: newContractForm.clientName || selected?.clientName || '',
        role: newContractForm.role,
        billingRate: Number(newContractForm.billingRate),
        currency: newContractForm.currency,
        workingHoursPerWeek: Number(newContractForm.workingHoursPerWeek),
        noticePeriodDays: Number(newContractForm.noticePeriodDays),
        governingLaw: newContractForm.governingLaw || undefined,
        startDate: newContractForm.startDate,
        endDate: newContractForm.endDate || undefined,
        renewalDate: newContractForm.renewalDate || undefined,
      });
      setShowForm(false); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Secondment Contracts</h1>
          <p className="rec-page__sub">{contracts.filter(c => c.status === 'ACTIVE').length} active contracts</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New contract'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['ALL', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED'] as const).map(s => (
          <button key={s} className={`btn btn--sm${statusFilter === s ? ' btn--primary' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card rec-form-card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>New secondment contract</h3>
          <form className="rec-form" onSubmit={submitNewContract}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Assignment <span className="rec-form__req">*</span>
                <select className="auth-input" value={newContractForm.assignmentId}
                  onChange={e => {
                    const a = assignments.find(x => x.id === e.target.value);
                    setNewContractForm(p => ({ ...p, assignmentId: e.target.value, clientName: a?.clientName ?? '', role: a?.roleName ?? '' }));
                  }} required>
                  <option value="">Select assignment…</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.employee?.firstName} {a.employee?.lastName} → {a.clientName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">Contract ref<input className="auth-input" value={newContractForm.contractRef} onChange={e => setNewContractForm(p => ({ ...p, contractRef: e.target.value }))} placeholder="SC-2026-001" /></label>
              <label className="rec-form__label">Role <span className="rec-form__req">*</span><input className="auth-input" value={newContractForm.role} onChange={e => setNewContractForm(p => ({ ...p, role: e.target.value }))} required /></label>
              <label className="rec-form__label">Billing rate <span className="rec-form__req">*</span><input className="auth-input" type="number" min={0} value={newContractForm.billingRate} onChange={e => setNewContractForm(p => ({ ...p, billingRate: e.target.value }))} required /></label>
              <label className="rec-form__label">Currency
                <select className="auth-input" value={newContractForm.currency} onChange={e => setNewContractForm(p => ({ ...p, currency: e.target.value }))}>
                  <option>RWF</option><option>USD</option><option>EUR</option>
                </select>
              </label>
              <label className="rec-form__label">Hours/week<input className="auth-input" type="number" min={1} max={168} value={newContractForm.workingHoursPerWeek} onChange={e => setNewContractForm(p => ({ ...p, workingHoursPerWeek: e.target.value }))} /></label>
              <label className="rec-form__label">Notice period (days)<input className="auth-input" type="number" min={0} value={newContractForm.noticePeriodDays} onChange={e => setNewContractForm(p => ({ ...p, noticePeriodDays: e.target.value }))} /></label>
              <label className="rec-form__label">Governing law<input className="auth-input" value={newContractForm.governingLaw} onChange={e => setNewContractForm(p => ({ ...p, governingLaw: e.target.value }))} placeholder="Rwandan Law" /></label>
              <label className="rec-form__label">Start date <span className="rec-form__req">*</span><input className="auth-input" type="date" value={newContractForm.startDate} onChange={e => setNewContractForm(p => ({ ...p, startDate: e.target.value }))} required /></label>
              <label className="rec-form__label">End date<input className="auth-input" type="date" value={newContractForm.endDate} onChange={e => setNewContractForm(p => ({ ...p, endDate: e.target.value }))} /></label>
              <label className="rec-form__label">Renewal date<input className="auth-input" type="date" value={newContractForm.renewalDate} onChange={e => setNewContractForm(p => ({ ...p, renewalDate: e.target.value }))} /></label>
            </div>
            <div className="rec-form__actions">
              <button className="btn" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create contract'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="muted">Loading…</p> : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Client</th>
                <th>Role</th>
                <th>Billing rate</th>
                <th>Hours/wk</th>
                <th>Notice</th>
                <th>Start</th>
                <th>End / Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 && <tr><td colSpan={10} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>No contracts found</td></tr>}
              {contracts.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.assignment?.employee?.firstName} {c.assignment?.employee?.lastName}</strong>
                    {c.contractRef && <div className="muted" style={{ fontSize: '0.78rem' }}>{c.contractRef}</div>}
                  </td>
                  <td>{c.clientName}</td>
                  <td>{c.role}</td>
                  <td>{Number(c.billingRate).toLocaleString()} {c.currency}</td>
                  <td>{c.workingHoursPerWeek}h</td>
                  <td>{c.noticePeriodDays}d</td>
                  <td>{new Date(c.startDate).toLocaleDateString()}</td>
                  <td><ExpiryCell endDate={c.endDate} alert30={c.alert30Sent} alert60={c.alert60Sent} alert90={c.alert90Sent} /></td>
                  <td><span className={STATUS_CLASS[c.status]}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {c.status === 'ACTIVE' && <>
                        <button className="btn btn--sm" onClick={() => { setSelected(c); setAmendForm({ billingRate: String(c.billingRate), endDate: c.endDate?.slice(0, 10) ?? '', role: c.role, noticePeriodDays: String(c.noticePeriodDays), reason: '' }); setModal('amend'); }}>Amend</button>
                        <button className="btn btn--sm btn--primary" onClick={() => { setSelected(c); setRenewForm({ newEndDate: '', billingRate: String(c.billingRate), notes: '' }); setModal('renew'); }}>Renew</button>
                        <button className="btn btn--sm" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => { setSelected(c); setTerminateForm({ reason: '', terminationDate: '' }); setModal('terminate'); }}>Terminate</button>
                      </>}
                      <button className="btn btn--sm" onClick={() => openAmendmentLog(c)}>Log ({c.amendments?.length ?? 0})</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '2rem', width: '440px', maxWidth: '94vw', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

            {modal === 'amend' && (
              <form onSubmit={submitAmend}>
                <h3 style={{ margin: '0 0 0.5rem' }}>Amend contract</h3>
                <p className="muted" style={{ margin: '0 0 1.25rem', fontSize: '0.875rem' }}>{selected.clientName} — {selected.role}</p>
                <div className="rec-form">
                  <label className="rec-form__label">New billing rate<input className="auth-input" type="number" min={0} value={amendForm.billingRate} onChange={e => setAmendForm(p => ({ ...p, billingRate: e.target.value }))} /></label>
                  <label className="rec-form__label">New end date<input className="auth-input" type="date" value={amendForm.endDate} onChange={e => setAmendForm(p => ({ ...p, endDate: e.target.value }))} /></label>
                  <label className="rec-form__label">New role<input className="auth-input" value={amendForm.role} onChange={e => setAmendForm(p => ({ ...p, role: e.target.value }))} /></label>
                  <label className="rec-form__label">Notice period (days)<input className="auth-input" type="number" min={0} value={amendForm.noticePeriodDays} onChange={e => setAmendForm(p => ({ ...p, noticePeriodDays: e.target.value }))} /></label>
                  <label className="rec-form__label">Reason for amendment <span className="rec-form__req">*</span><input className="auth-input" value={amendForm.reason} onChange={e => setAmendForm(p => ({ ...p, reason: e.target.value }))} required /></label>
                  <div className="rec-form__actions"><button className="btn" type="button" onClick={closeModal}>Cancel</button><button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save amendment'}</button></div>
                </div>
              </form>
            )}

            {modal === 'terminate' && (
              <form onSubmit={submitTerminate}>
                <h3 style={{ margin: '0 0 0.5rem' }}>Terminate contract</h3>
                <p className="muted" style={{ margin: '0 0 1.25rem', fontSize: '0.875rem' }}>{selected.clientName} — {selected.role}</p>
                <div className="rec-form">
                  <label className="rec-form__label">Termination reason <span className="rec-form__req">*</span><input className="auth-input" value={terminateForm.reason} onChange={e => setTerminateForm(p => ({ ...p, reason: e.target.value }))} required /></label>
                  <label className="rec-form__label">Termination date<input className="auth-input" type="date" value={terminateForm.terminationDate} onChange={e => setTerminateForm(p => ({ ...p, terminationDate: e.target.value }))} /></label>
                  <div className="rec-form__actions"><button className="btn" type="button" onClick={closeModal}>Cancel</button><button className="btn" style={{ background: '#dc2626', color: '#fff', border: 'none' }} type="submit" disabled={busy}>{busy ? 'Terminating…' : 'Terminate contract'}</button></div>
                </div>
              </form>
            )}

            {modal === 'renew' && (
              <form onSubmit={submitRenew}>
                <h3 style={{ margin: '0 0 0.5rem' }}>Renew contract</h3>
                <p className="muted" style={{ margin: '0 0 1.25rem', fontSize: '0.875rem' }}>{selected.clientName} — {selected.role}</p>
                <div className="rec-form">
                  <label className="rec-form__label">New end date <span className="rec-form__req">*</span><input className="auth-input" type="date" value={renewForm.newEndDate} onChange={e => setRenewForm(p => ({ ...p, newEndDate: e.target.value }))} required /></label>
                  <label className="rec-form__label">New billing rate (leave blank to keep {Number(selected.billingRate).toLocaleString()} {selected.currency})<input className="auth-input" type="number" min={0} value={renewForm.billingRate} onChange={e => setRenewForm(p => ({ ...p, billingRate: e.target.value }))} /></label>
                  <label className="rec-form__label">Notes<input className="auth-input" value={renewForm.notes} onChange={e => setRenewForm(p => ({ ...p, notes: e.target.value }))} /></label>
                  <div className="rec-form__actions"><button className="btn" type="button" onClick={closeModal}>Cancel</button><button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Renewing…' : 'Renew contract'}</button></div>
                </div>
              </form>
            )}

            {modal === 'log' && (
              <div>
                <h3 style={{ margin: '0 0 0.5rem' }}>Amendment log</h3>
                <p className="muted" style={{ margin: '0 0 1.25rem', fontSize: '0.875rem' }}>{selected.clientName} — {selected.role}</p>
                {amendments.length === 0 ? <p className="muted">No amendments recorded.</p> : amendments.map(a => (
                  <div key={a.id} style={{ borderLeft: '3px solid var(--brand)', paddingLeft: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{new Date(a.createdAt).toLocaleString()}</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{a.reason}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>{a.changesSummary}</div>
                  </div>
                ))}
                <div className="rec-form__actions"><button className="btn btn--primary" onClick={closeModal}>Close</button></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

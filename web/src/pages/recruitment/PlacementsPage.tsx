import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import { hasAnyRole } from '../../lib/roles';
import {
  createPlacement,
  fetchOffers,
  fetchPlacements,
  updatePlacementInvoice,
  type InvoiceStatus,
  type Offer,
  type Placement,
} from '../../recruitmentApi';

const INVOICE_CLASS: Record<InvoiceStatus, string> = {
  PENDING: 'badge badge--gray',
  GENERATED: 'badge badge--blue',
  SENT: 'badge badge--orange',
  PAID: 'badge badge--green',
};

const INVOICE_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pending',
  GENERATED: 'Generated',
  SENT: 'Sent',
  PAID: 'Paid',
};

export function PlacementsPage() {
  const [canManageInvoices, setCanManageInvoices] = useState(false);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [acceptedOffers, setAcceptedOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState('');
  const [roleName, setRoleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [salary, setSalary] = useState('');
  const [clientName, setClientName] = useState('');
  const [reportingLine, setReportingLine] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setPlacements(await fetchPlacements());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchMe()
      .then((me) => setCanManageInvoices(hasAnyRole(me.roles, ['TENANT_ADMIN', 'FINANCE_OFFICER'])))
      .catch(() => setCanManageInvoices(false));
  }, []);

  const onOpenForm = async () => {
    setShowForm(true);
    setErr(null);
    try {
      const offers = await fetchOffers({ status: 'ACCEPTED' });
      const unplaced = offers.filter((o) => !o.placement);
      setAcceptedOffers(unplaced);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!selectedOffer || !roleName || !startDate || !salary) return;
    setBusy(true);
    setErr(null);
    const offer = acceptedOffers.find((o) => o.id === selectedOffer);
    if (!offer) { setBusy(false); return; }
    try {
      await createPlacement({
        offerId: selectedOffer,
        jobId: offer.jobId,
        candidateId: offer.candidateId,
        roleName: roleName.trim(),
        startDate,
        salary: parseFloat(salary),
        currency: 'RWF',
        clientName: clientName.trim() || undefined,
        reportingLine: reportingLine.trim() || undefined,
      });
      setSelectedOffer(''); setRoleName(''); setStartDate('');
      setSalary(''); setClientName(''); setReportingLine('');
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onUpdateInvoice = async (id: string, invoiceStatus: InvoiceStatus) => {
    setErr(null);
    try {
      await updatePlacementInvoice(id, invoiceStatus);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const totalSalary = placements.reduce((s, p) => s + p.salary, 0);

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Placements</h1>
          <p className="rec-page__sub">
            {placements.length} placement{placements.length !== 1 ? 's' : ''}
            {placements.length > 0 && (
              <span className="muted"> · Total value: {totalSalary.toLocaleString()} RWF</span>
            )}
          </p>
        </div>
        <button className="btn btn--primary" onClick={onOpenForm}>
          + Confirm placement
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">Confirm placement</h2>
          <p className="muted small">Only accepted offers without a placement record are shown.</p>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Accepted offer *
                <select
                  className="auth-input"
                  value={selectedOffer}
                  onChange={(e) => setSelectedOffer(e.target.value)}
                  required
                >
                  <option value="">— select offer —</option>
                  {acceptedOffers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.application.candidate.firstName} {o.application.candidate.lastName} →{' '}
                      {o.application.job.title} · {o.salary.toLocaleString()} {o.currency}
                    </option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label rec-form__label--full">
                Role name *
                <input
                  className="auth-input"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                  placeholder="Exact job title confirmed on placement"
                />
              </label>
              <label className="rec-form__label">
                Start date *
                <input
                  className="auth-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </label>
              <label className="rec-form__label">
                Agreed salary (RWF) *
                <input
                  className="auth-input"
                  type="number"
                  min="0"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  required
                />
              </label>
              <label className="rec-form__label">
                Client / Company
                <input
                  className="auth-input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Ltd"
                />
              </label>
              <label className="rec-form__label">
                Reporting line
                <input
                  className="auth-input"
                  value={reportingLine}
                  onChange={(e) => setReportingLine(e.target.value)}
                  placeholder="e.g. Director of Finance"
                />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy || !selectedOffer || !roleName || !startDate || !salary}>
                {busy ? 'Confirming…' : 'Confirm placement'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading placements…</p>}

      {!loading && placements.length === 0 && (
        <div className="rec-empty">
          <p>No placements yet. Accept an offer, then confirm the placement here.</p>
        </div>
      )}

      {!loading && placements.length > 0 && (
        <div className="rec-placements-list">
          {placements.map((p) => {
            const candidate = p.offer.application.candidate;
            const nextInvoice: Partial<Record<InvoiceStatus, InvoiceStatus>> = {
              GENERATED: 'SENT',
              SENT: 'PAID',
            };
            return (
              <div key={p.id} className="placement-card card">
                <div className="placement-card__top">
                  <div>
                    <div className="placement-card__name">
                      {candidate.firstName} {candidate.lastName}
                    </div>
                    <div className="placement-card__role muted small">
                      {p.roleName}
                      {p.clientName && <span> at {p.clientName}</span>}
                    </div>
                    {p.reportingLine && (
                      <div className="placement-card__reporting muted small">
                        Reports to: {p.reportingLine}
                      </div>
                    )}
                  </div>
                  <span className={INVOICE_CLASS[p.invoiceStatus as InvoiceStatus]}>
                    Invoice: {INVOICE_LABELS[p.invoiceStatus as InvoiceStatus]}
                  </span>
                </div>
                <div className="placement-card__details">
                  <span>
                    <strong>{p.salary.toLocaleString()} {p.currency}</strong>
                  </span>
                  {p.offer.application.job.feeValue != null && (
                    <span className="muted small">
                      Fee: {p.offer.application.job.currency}{' '}
                      {p.offer.application.job.feeValue.toLocaleString()}
                    </span>
                  )}
                  <span className="muted small">
                    Start: {new Date(p.startDate).toLocaleDateString()}
                  </span>
                  <span className="muted small">
                    Placed: {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {canManageInvoices && nextInvoice[p.invoiceStatus as InvoiceStatus] && (
                  <div className="placement-card__actions">
                    <button
                      className="btn btn--ghost small"
                      type="button"
                      onClick={() =>
                        onUpdateInvoice(p.id, nextInvoice[p.invoiceStatus as InvoiceStatus]!)
                      }
                    >
                      Mark {INVOICE_LABELS[nextInvoice[p.invoiceStatus as InvoiceStatus]!]}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

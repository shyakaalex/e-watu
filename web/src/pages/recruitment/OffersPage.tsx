import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  acceptOffer,
  createOffer,
  fetchApplications,
  fetchOffers,
  rejectOffer,
  sendOffer,
  updateOffer,
  withdrawOffer,
  type Application,
  type Offer,
  type OfferStatus,
  type SignatureStatus,
} from '../../recruitmentApi';
import { uploadViaPresign } from '../../documentApi';

const STATUS_CLASS: Record<OfferStatus, string> = {
  DRAFT: 'badge badge--gray',
  SENT: 'badge badge--blue',
  UNDER_REVIEW: 'badge badge--orange',
  NEGOTIATING: 'badge badge--orange',
  ACCEPTED: 'badge badge--green',
  REJECTED: 'badge badge--red',
  WITHDRAWN: 'badge badge--red',
};

const STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  UNDER_REVIEW: 'Under Review',
  NEGOTIATING: 'Negotiating',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const SIG_LABELS: Record<SignatureStatus, string> = {
  SENT: 'Sent for signing',
  VIEWED: 'Viewed',
  SIGNED: 'Signed',
};

export function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [probationDays, setProbationDays] = useState('90');
  const [offerLetterUrl, setOfferLetterUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setOffers(await fetchOffers(filterStatus ? { status: filterStatus } : undefined));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const onOpenForm = async () => {
    setShowForm(true);
    setErr(null);
    try {
      const apps = await fetchApplications({ stage: 'OFFERED' });
      setApplications(apps);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!selectedApp || !salary) return;
    setBusy(true);
    setErr(null);
    const app = applications.find((a) => a.id === selectedApp);
    if (!app) { setBusy(false); return; }
    try {
      await createOffer({
        applicationId: selectedApp,
        jobId: app.jobId,
        candidateId: app.candidateId,
        salary: parseFloat(salary),
        currency: 'RWF',
        startDate: startDate || undefined,
        probationDays: parseInt(probationDays, 10),
        offerLetterUrl: offerLetterUrl.trim() || undefined,
        status: 'DRAFT',
      });
      setSelectedApp(''); setSalary(''); setStartDate('');
      setProbationDays('90'); setOfferLetterUrl('');
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onUpdateSignature = async (id: string, signatureStatus: SignatureStatus) => {
    setErr(null);
    try {
      await updateOffer(id, { signatureStatus });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Offers</h1>
          <p className="rec-page__sub">{offers.length} offer{offers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rec-page__actions">
          <select
            className="auth-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABELS) as OfferStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button className="btn btn--primary" onClick={onOpenForm}>
            + New offer
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">Create offer letter</h2>
          <p className="muted small">Only applications at the Offered stage are shown.</p>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Application *
                <select
                  className="auth-input"
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  required
                >
                  <option value="">— select application —</option>
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.candidate.firstName} {a.candidate.lastName} → {a.job.title}
                    </option>
                  ))}
                </select>
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
                  placeholder="e.g. 500000"
                />
              </label>
              <label className="rec-form__label">
                Start date
                <input
                  className="auth-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="rec-form__label">
                Probation (days)
                <input
                  className="auth-input"
                  type="number"
                  min="0"
                  value={probationDays}
                  onChange={(e) => setProbationDays(e.target.value)}
                />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Offer letter URL
                <input
                  className="auth-input"
                  value={offerLetterUrl}
                  onChange={(e) => setOfferLetterUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy || !selectedApp || !salary}>
                {busy ? 'Saving…' : 'Create offer'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading offers…</p>}

      {!loading && offers.length === 0 && (
        <div className="rec-empty">
          <p>No offers yet. Move a candidate to Offered stage, then create an offer here.</p>
        </div>
      )}

      {!loading && offers.length > 0 && (
        <div className="rec-offers-list">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onReload={load}
              onUpdateSignature={onUpdateSignature}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  onReload,
  onUpdateSignature,
}: {
  offer: Offer;
  onReload: () => Promise<void>;
  onUpdateSignature: (id: string, sig: SignatureStatus) => void;
}) {
  const [showNeg, setShowNeg] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);
  const { application: app } = offer;

  const runAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onReload();
    } finally {
      setBusy(false);
    }
  };

  const onUploadLetter = async (file: File) => {
    const url = await uploadViaPresign(file, `offers/${offer.id}/${file.name}`);
    await updateOffer(offer.id, { offerLetterUrl: url });
    await onReload();
  };

  return (
    <div className="offer-card card">
      <div className="offer-card__top">
        <div>
          <div className="offer-card__name">
            {app.candidate.firstName} {app.candidate.lastName}
          </div>
          <div className="offer-card__role muted small">{app.job.title}</div>
          {app.job.clientName && (
            <div className="offer-card__client muted small">{app.job.clientName}</div>
          )}
        </div>
        <span className={STATUS_CLASS[offer.status]}>{STATUS_LABELS[offer.status]}</span>
      </div>
      <div className="offer-card__details">
        <span>
          <strong>{offer.salary.toLocaleString()} {offer.currency}</strong>
        </span>
        {offer.startDate && (
          <span className="muted small">Start: {new Date(offer.startDate).toLocaleDateString()}</span>
        )}
        <span className="muted small">Probation: {offer.probationDays} days</span>
        {offer.signatureStatus && (
          <span className="badge badge--blue">
            {SIG_LABELS[offer.signatureStatus as SignatureStatus]}
          </span>
        )}
      </div>

      <div className="offer-card__letter">
        <label className="btn btn--ghost small">
          Upload offer letter (PDF)
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void runAction(() => onUploadLetter(f));
            }}
          />
        </label>
      {offer.offerLetterUrl && (
        <>
          <a href={offer.offerLetterUrl} target="_blank" rel="noreferrer" className="btn btn--ghost small">
            View offer letter
          </a>
          {!offer.signatureStatus && (
            <button className="btn btn--ghost small" onClick={() => onUpdateSignature(offer.id, 'SENT')}>
              Mark sent for signing
            </button>
          )}
          {offer.signatureStatus === 'SENT' && (
            <button className="btn btn--ghost small" onClick={() => onUpdateSignature(offer.id, 'SIGNED')}>
              Mark signed
            </button>
          )}
        </>
      )}
      </div>

      <div className="offer-card__actions">
        {offer.status === 'DRAFT' && (
          <>
            <button type="button" className="btn btn--primary small" disabled={busy} onClick={() => void runAction(() => sendOffer(offer.id))}>
              Send offer
            </button>
            <button type="button" className="btn btn--ghost small" disabled={busy} onClick={() => void runAction(() => withdrawOffer(offer.id))}>
              Withdraw
            </button>
          </>
        )}
        {offer.status === 'SENT' && (
          <>
            <button type="button" className="btn btn--primary small" disabled={busy} onClick={() => void runAction(() => acceptOffer(offer.id))}>
              Accept
            </button>
            <button type="button" className="btn btn--danger small" disabled={busy} onClick={() => setRejectOpen(true)}>
              Reject
            </button>
            <button type="button" className="btn btn--ghost small" disabled={busy} onClick={() => void runAction(() => withdrawOffer(offer.id))}>
              Withdraw
            </button>
          </>
        )}
      </div>

      {rejectOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-card__title">Reject offer</h3>
            <textarea className="auth-input rec-textarea" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason (optional)" />
            <div className="rec-form__actions">
              <button type="button" className="btn btn--danger" disabled={busy} onClick={() => void runAction(() => rejectOffer(offer.id, rejectReason || undefined)).then(() => setRejectOpen(false))}>
                Confirm reject
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setRejectOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {offer.status === 'NEGOTIATING' && (
        <button className="btn btn--ghost small" onClick={() => setShowNeg((v) => !v)}>
          {showNeg ? 'Hide' : 'Counter-offer notes'}
        </button>
      )}
      {showNeg && offer.counterNotes && (
        <div className="offer-card__notes muted small">{offer.counterNotes}</div>
      )}

      {offer.placement && (
        <div className="offer-card__placed">
          Placed — starts {new Date(offer.placement.startDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

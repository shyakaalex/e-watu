import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCandidates, type Candidate } from '../../recruitmentApi';
import {
  addCandidateToPool,
  fetchPool,
  removeCandidateFromPool,
  type TalentPool,
  type TalentPoolProfile,
} from '../../talentPoolApi';

export function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<TalentPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [candidateId, setCandidateId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [recruitmentCandidates, setRecruitmentCandidates] = useState<Candidate[]>([]);
  const [loadingRecruitmentCandidates, setLoadingRecruitmentCandidates] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  const load = useCallback(async () => {
    if (!poolId) return;
    setLoading(true);
    setErr(null);
    try {
      setPool(await fetchPool(poolId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showAddForm) return;
    let alive = true;
    const loadCandidates = async () => {
      setLoadingRecruitmentCandidates(true);
      try {
        const candidates = await fetchCandidates({ limit: 100 });
        if (alive) setRecruitmentCandidates(candidates);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoadingRecruitmentCandidates(false);
      }
    };
    void loadCandidates();
    return () => {
      alive = false;
    };
  }, [showAddForm]);

  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const onAdd = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!poolId || !candidateId.trim()) return;
    const trimmedCandidateId = candidateId.trim();
    if (!uuidLike.test(trimmedCandidateId)) {
      setErr('Candidate ID must be a UUID from Recruitment candidates.');
      return;
    }
    setAddBusy(true);
    setErr(null);
    try {
      await addCandidateToPool(poolId, {
        candidateId: trimmedCandidateId,
        notes: notes.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
      });
      setCandidateId('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setNotes('');
      setSelectedCandidateId('');
      setShowAddForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAddBusy(false);
    }
  };

  const onRemove = async (profile: TalentPoolProfile) => {
    if (!poolId) return;
    if (!confirm(`Remove ${profile.firstName ?? ''} ${profile.lastName ?? ''} from this pool?`)) return;
    try {
      await removeCandidateFromPool(poolId, profile.candidateId);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) return <div className="rec-page"><p className="muted">Loading…</p></div>;
  if (!pool) return <div className="rec-page"><div className="alert alert--err">{err || 'Not found'}</div></div>;

  const profiles = pool.profiles ?? [];

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <div className="rec-page__breadcrumb">
            <Link to="/talent-pool/pools">Pools</Link> / {pool.name}
          </div>
          <h1 className="rec-page__title">{pool.name}</h1>
          {pool.description && <p className="rec-page__sub">{pool.description}</p>}
          <span className="muted small">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn--primary" type="button" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Cancel' : '+ Add candidate'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showAddForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">Add candidate to pool</h2>
          <form className="rec-form" onSubmit={onAdd}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Pick from recruitment candidates (recommended)
                <select
                  className="auth-input"
                  value={selectedCandidateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCandidateId(id);
                    const c = recruitmentCandidates.find((candidate) => candidate.id === id);
                    if (!c) return;
                    setCandidateId(c.id);
                    setFirstName(c.firstName ?? '');
                    setLastName(c.lastName ?? '');
                    setEmail(c.email ?? '');
                  }}
                  disabled={loadingRecruitmentCandidates}
                >
                  <option value="">
                    {loadingRecruitmentCandidates ? 'Loading candidates…' : 'Select candidate'}
                  </option>
                  {recruitmentCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} - {c.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label rec-form__label--full">
                Candidate ID (UUID from recruitment) *
                <input className="auth-input" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} required />
                <span className="muted small">Numeric IDs like 101 are invalid here.</span>
              </label>
              <label className="rec-form__label">
                First name
                <input className="auth-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="rec-form__label">
                Last name
                <input className="auth-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
              <label className="rec-form__label">
                Email
                <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Notes
                <textarea className="auth-input rec-textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>
            <button className="btn btn--primary" type="submit" disabled={addBusy}>
              {addBusy ? 'Adding…' : 'Add to pool'}
            </button>
          </form>
        </div>
      )}

      {profiles.length === 0 && <div className="rec-empty"><p>No candidates in this pool yet.</p></div>}

      <div className="tp-pools-grid">
        {profiles.map((p) => (
          <div key={p.id} className="tp-pool-card">
            <div className="tp-pool-card__body">
              <div className="tp-pool-card__name">
                {p.firstName} {p.lastName}
              </div>
              {p.email && <p className="muted small">{p.email}</p>}
              {p.source && <span className="badge badge--gray">{p.source}</span>}
              {p.tags.length > 0 && (
                <div className="tp-pool-card__tags">
                  {p.tags.map((t) => (
                    <span key={t} className="badge badge--teal">{t}</span>
                  ))}
                </div>
              )}
              {p.notes && <p className="muted small">{p.notes}</p>}
            </div>
            <div className="tp-pool-card__footer">
              <button className="btn btn--ghost" type="button" onClick={() => onRemove(p)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

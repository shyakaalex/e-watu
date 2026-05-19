import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addToPool, fetchPool, fetchProfiles, removeFromPool, updateMember,
  type CandidateProfile, type PoolMember, type TalentPool,
} from '../../talentPoolApi';

const AVAIL_BADGE: Record<string, string> = {
  AVAILABLE: 'badge--green',
  OPEN_TO_OFFERS: 'badge--blue',
  NOT_LOOKING: 'badge--red',
  UNKNOWN: 'badge--gray',
};

export function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<TalentPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [profiles, setProfiles] = useState<CandidateProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [fitScore, setFitScore] = useState('');
  const [notes, setNotes] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');

  const [editingMember, setEditingMember] = useState<PoolMember | null>(null);
  const [editScore, setEditScore] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const load = useCallback(async () => {
    if (!poolId) return;
    setLoading(true); setErr(null);
    try { setPool(await fetchPool(poolId)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [poolId]);

  useEffect(() => { load(); }, [load]);

  const onOpenAddForm = async () => {
    setShowAddForm(true);
    try { setProfiles(await fetchProfiles()); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const onAdd = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!poolId || !selectedProfile) return;
    setAddBusy(true); setErr(null);
    try {
      await addToPool(poolId, selectedProfile, fitScore ? parseInt(fitScore, 10) : undefined, notes.trim() || undefined);
      setSelectedProfile(''); setFitScore(''); setNotes(''); setProfileSearch(''); setShowAddForm(false);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setAddBusy(false); }
  };

  const onRemove = async (memberId: string) => {
    if (!poolId) return;
    try { await removeFromPool(poolId, memberId); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const onSaveEdit = async () => {
    if (!poolId || !editingMember) return;
    try {
      await updateMember(poolId, editingMember.id, {
        fitScore: editScore ? parseInt(editScore, 10) : undefined,
        notes: editNotes.trim() || undefined,
      });
      setEditingMember(null); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return <div className="rec-page"><p className="muted">Loading…</p></div>;
  if (!pool) return <div className="rec-page"><div className="alert alert--err">{err || 'Not found'}</div></div>;

  const existingIds = new Set((pool.members ?? []).map((m) => m.profileId));
  const filteredProfiles = profiles.filter((p) => {
    if (existingIds.has(p.id)) return false;
    if (!profileSearch) return true;
    const q = profileSearch.toLowerCase();
    return `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <div className="rec-page__breadcrumb"><Link to="/talent-pool/pools">Pools</Link> / {pool.name}</div>
          <h1 className="rec-page__title">{pool.name}</h1>
          {pool.description && <p className="rec-page__sub">{pool.description}</p>}
          <div className="rec-job-meta-row">
            {pool.tags.map((t) => <span key={t} className="badge badge--teal">{t}</span>)}
            <span className="muted small">{pool.members?.length ?? 0} member{(pool.members?.length ?? 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button className="btn btn--primary" onClick={onOpenAddForm}>+ Add profile</button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showAddForm && (
        <div className="card rec-form-card">
          <h3 className="rec-form-card__title">Add profile to pool</h3>
          <form className="rec-form" onSubmit={onAdd}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Search profiles
                <input className="auth-input" placeholder="Name or email…" value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Select profile *
                <select className="auth-input" value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} required size={Math.min(filteredProfiles.length + 1, 6)}>
                  <option value="">— choose —</option>
                  {filteredProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} · {p.email}{p.currentTitle ? ` · ${p.currentTitle}` : ''}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                Fit score (0–100)
                <input className="auth-input" type="number" min="0" max="100" value={fitScore} onChange={(e) => setFitScore(e.target.value)} placeholder="e.g. 85" />
              </label>
              <label className="rec-form__label">
                Notes
                <input className="auth-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why this candidate?" />
              </label>
            </div>
            {filteredProfiles.length === 0 && profileSearch && (
              <p className="muted small">No matches. <Link to="/talent-pool/profiles">Add a profile →</Link></p>
            )}
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={addBusy || !selectedProfile}>{addBusy ? 'Adding…' : 'Add to pool'}</button>
              <button className="btn btn--ghost" type="button" onClick={() => { setShowAddForm(false); setProfileSearch(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {(pool.members?.length ?? 0) === 0 && (
        <div className="rec-empty"><p>No members yet. Add profiles to this pool.</p></div>
      )}

      {(pool.members?.length ?? 0) > 0 && (
        <div className="tp-members-list">
          {(pool.members ?? []).map((m) => (
            <div key={m.id} className="tp-member-card card">
              {editingMember?.id === m.id ? (
                <div className="tp-member-card__edit">
                  <label className="rec-form__label">
                    Fit score
                    <input className="auth-input" type="number" min="0" max="100" value={editScore} onChange={(e) => setEditScore(e.target.value)} />
                  </label>
                  <label className="rec-form__label">
                    Notes
                    <input className="auth-input" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                  </label>
                  <div className="rec-form__actions" style={{ marginTop: '0.5rem' }}>
                    <button className="btn btn--primary" onClick={onSaveEdit}>Save</button>
                    <button className="btn btn--ghost" onClick={() => setEditingMember(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="tp-member-card__main">
                    <div className="tp-member-card__avatar">{m.profile.firstName[0]}{m.profile.lastName[0]}</div>
                    <div className="tp-member-card__info">
                      <div className="tp-member-card__name">{m.profile.firstName} {m.profile.lastName}</div>
                      {m.profile.currentTitle && <div className="muted small">{m.profile.currentTitle}</div>}
                      <div className="muted small">{m.profile.email}</div>
                      {m.profile.location && <div className="muted small">📍 {m.profile.location}</div>}
                      <div className="tp-member-card__skills">
                        {m.profile.skills.slice(0, 5).map((s) => <span key={s} className="badge badge--gray">{s}</span>)}
                        {m.profile.skills.length > 5 && <span className="muted small">+{m.profile.skills.length - 5} more</span>}
                      </div>
                    </div>
                    <div className="tp-member-card__meta">
                      <span className={`badge ${AVAIL_BADGE[m.profile.availabilityStatus]}`}>
                        {m.profile.availabilityStatus.replace('_', ' ')}
                      </span>
                      {m.fitScore !== null && (
                        <div className="tp-member-card__score">
                          <span className="tp-member-card__score-num">{m.fitScore}</span>
                          <span className="muted small">/100</span>
                        </div>
                      )}
                      {m.notes && <div className="muted small tp-member-card__notes">{m.notes}</div>}
                    </div>
                  </div>
                  <div className="tp-member-card__actions">
                    <button className="btn btn--ghost small" onClick={() => { setEditingMember(m); setEditScore(String(m.fitScore ?? '')); setEditNotes(m.notes ?? ''); }}>Edit</button>
                    <button className="btn btn--ghost small" onClick={() => onRemove(m.id)}>Remove</button>
                    {m.profile.linkedinUrl && <a href={m.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">LinkedIn ↗</a>}
                    {m.profile.cvUrl && <a href={m.profile.cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">CV ↗</a>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

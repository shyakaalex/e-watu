import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPool, deletePool, fetchPools, type TalentPool } from '../../talentPoolApi';

export function PoolsPage() {
  const [pools, setPools] = useState<TalentPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setPools(await fetchPools()); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault(); setBusy(true); setErr(null);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await createPool({ name: name.trim(), description: description.trim() || undefined, tags });
      setName(''); setDescription(''); setTagsInput(''); setShowForm(false);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this pool? Members will be removed too.')) return;
    try { await deletePool(id); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Talent Pools</h1>
          <p className="rec-page__sub">{pools.length} pool{pools.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New pool'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">Create talent pool</h2>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Pool name *
                <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Senior Engineers Kigali" />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Description
                <textarea className="auth-input rec-textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What kind of talent is in this pool?" />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Tags <span className="muted small">(comma separated)</span>
                <input className="auth-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="finance, senior, kigali" />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create pool'}</button>
              <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}

      {!loading && pools.length === 0 && (
        <div className="rec-empty"><p>No pools yet. Create your first talent pool.</p></div>
      )}

      {!loading && pools.length > 0 && (
        <div className="tp-pools-grid">
          {pools.map((pool) => (
            <div key={pool.id} className="tp-pool-card">
              <div className="tp-pool-card__body">
                <div className="tp-pool-card__name">{pool.name}</div>
                {pool.description && <p className="tp-pool-card__desc muted small">{pool.description}</p>}
                <div className="tp-pool-card__count">
                  <span className="tp-pool-card__count-num">{pool._count?.members ?? 0}</span>
                  <span className="muted small"> member{(pool._count?.members ?? 0) !== 1 ? 's' : ''}</span>
                </div>
                {pool.tags.length > 0 && (
                  <div className="tp-pool-card__tags">
                    {pool.tags.map((t) => <span key={t} className="badge badge--teal">{t}</span>)}
                  </div>
                )}
              </div>
              <div className="tp-pool-card__footer">
                <Link to={`/talent-pool/pools/${pool.id}`} className="btn btn--primary">
                  Open →
                </Link>
                <button className="btn btn--ghost" onClick={() => onDelete(pool.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

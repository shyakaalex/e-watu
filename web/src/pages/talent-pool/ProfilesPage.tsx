import { useCallback, useEffect, useState } from 'react';
import { fetchProfiles, type ProfileSearchResult } from '../../talentPoolApi';

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [source, setSource] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setProfiles(
        await fetchProfiles({
          q: q.trim() || undefined,
          source: source || undefined,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [q, tagsInput, source]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Pool profiles</h1>
          <p className="rec-page__sub">{profiles.length} candidate{profiles.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {err && <div className="alert alert--err">{err}</div>}
      <div className="rec-page__actions" style={{ marginBottom: 16, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
        <input className="auth-input" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 200 }} />
        <input className="auth-input" placeholder="Tags (comma-separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} style={{ minWidth: 160 }} />
        <input className="auth-input" placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} style={{ minWidth: 120 }} />
      </div>
      {loading && <p className="muted">Loading…</p>}
      {!loading && profiles.length === 0 && <div className="rec-empty"><p>No profiles match your filters.</p></div>}
      <div className="tp-pools-grid">
        {profiles.map((p) => (
          <div key={p.candidateId} className="tp-pool-card">
            <div className="tp-pool-card__body">
              <div className="tp-pool-card__name">{p.firstName} {p.lastName}</div>
              {p.email && <p className="muted small">{p.email}</p>}
              {p.source && <span className="badge badge--gray">{p.source}</span>}
              {p.pools.length > 0 && (
                <p className="muted small">Pools: {p.pools.map((pool) => pool.name).join(', ')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { fetchDirectory, type DirectoryEntry } from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

export function CompanyDirectoryPage() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    setError(null);
    setLoading(true);
    try {
      setEntries(await fetchDirectory(q || undefined));
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const initials = (first: string, last: string) => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Company Directory</h1>
        <p className="adm-page__lead">Look up colleagues by name, job title, or department.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      <input
        className="auth-input"
        style={{ maxWidth: 360, marginBottom: '1.25rem' }}
        placeholder="Search name, title, or department…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="muted">No colleagues found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {entries.map((e) => (
            <div key={e.id} className="adm-card" style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <span
                style={{
                  width: 44, height: 44, borderRadius: '50%', background: '#1e293b', color: '#38bdf8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0,
                }}
              >
                {initials(e.firstName, e.lastName)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{e.firstName} {e.lastName}</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>{e.jobTitle}{e.department ? ` — ${e.department}` : ''}</div>
                <div className="muted" style={{ fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

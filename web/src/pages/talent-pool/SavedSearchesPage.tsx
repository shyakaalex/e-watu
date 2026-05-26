import { useCallback, useEffect, useState } from 'react';
import {
  createSavedSearch,
  deleteSavedSearch,
  fetchSavedSearches,
  runSavedSearch,
  type ProfileSearchResult,
  type SavedSearch,
} from '../../talentPoolApi';

export function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveQ, setSaveQ] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [runResults, setRunResults] = useState<Record<string, ProfileSearchResult[]>>({});
  const [runLoading, setRunLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setSearches(await fetchSavedSearches());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (!saveName.trim()) return;
    setSaveBusy(true);
    try {
      await createSavedSearch(saveName.trim(), { q: saveQ.trim() || undefined });
      setSaveName('');
      setSaveQ('');
      setShowSaveForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaveBusy(false);
    }
  };

  const onRun = async (id: string) => {
    setRunLoading(id);
    try {
      setRunResults((r) => ({ ...r, [id]: await runSavedSearch(id) }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRunLoading(null);
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Saved searches</h1>
          <p className="rec-page__sub">{searches.length} saved</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowSaveForm((v) => !v)}>
          {showSaveForm ? 'Cancel' : '+ Save search'}
        </button>
      </div>
      {err && <div className="alert alert--err">{err}</div>}
      {showSaveForm && (
        <div className="card rec-form-card">
          <input className="auth-input" placeholder="Search name" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
          <input className="auth-input" placeholder="Query (q)" value={saveQ} onChange={(e) => setSaveQ(e.target.value)} style={{ marginTop: 8 }} />
          <button type="button" className="btn btn--primary" style={{ marginTop: 8 }} disabled={saveBusy} onClick={() => void onSave()}>
            {saveBusy ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
      {loading && <p className="muted">Loading…</p>}
      {searches.map((s) => (
        <div key={s.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
          <strong>{s.name}</strong>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn--ghost small" disabled={runLoading === s.id} onClick={() => void onRun(s.id)}>
              {runLoading === s.id ? 'Running…' : 'Run'}
            </button>
            <button type="button" className="btn btn--ghost small" onClick={() => void deleteSavedSearch(s.id).then(load)}>
              Delete
            </button>
          </div>
          {runResults[s.id] && (
            <p className="muted small" style={{ marginTop: 8 }}>
              {runResults[s.id]!.length} result{runResults[s.id]!.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

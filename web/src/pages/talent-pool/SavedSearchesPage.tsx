import { useCallback, useEffect, useState } from 'react';
import {
  createSavedSearch, deleteSavedSearch, fetchSavedSearches, runSavedSearch,
  type CandidateProfile, type SavedSearch,
} from '../../talentPoolApi';

export function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // quick-save form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveQ, setSaveQ] = useState('');
  const [saveSkills, setSaveSkills] = useState('');
  const [saveLocation, setSaveLocation] = useState('');
  const [saveAvail, setSaveAvail] = useState('');
  const [saveMinExp, setSaveMinExp] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);

  // run results
  const [runResults, setRunResults] = useState<Record<string, CandidateProfile[]>>({});
  const [runLoading, setRunLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setSearches(await fetchSavedSearches()); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSave = async () => {
    if (!saveName.trim()) return;
    setSaveBusy(true); setErr(null);
    try {
      await createSavedSearch(saveName.trim(), {
        q: saveQ.trim() || undefined,
        skills: saveSkills.split(',').map((s) => s.trim()).filter(Boolean),
        location: saveLocation.trim() || undefined,
        availabilityStatus: saveAvail || undefined,
        minExperience: saveMinExp ? parseInt(saveMinExp, 10) : undefined,
      });
      setSaveName(''); setSaveQ(''); setSaveSkills(''); setSaveLocation(''); setSaveAvail(''); setSaveMinExp('');
      setShowSaveForm(false); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSaveBusy(false); }
  };

  const onDelete = async (id: string) => {
    try { await deleteSavedSearch(id); setRunResults((r) => { const n = { ...r }; delete n[id]; return n; }); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const onRun = async (id: string) => {
    setRunLoading(id);
    setErr(null);
    try {
      const result = await runSavedSearch(id);
      setRunResults((r) => ({ ...r, [id]: result }));
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
          <h1 className="rec-page__title">Saved Searches</h1>
          <p className="rec-page__sub">Store filter combinations and replay them anytime</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowSaveForm((v) => !v)}>
          {showSaveForm ? 'Cancel' : '+ Save search'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showSaveForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">Save a search</h2>
          <div className="rec-form__grid">
            <label className="rec-form__label rec-form__label--full">Name *<input className="auth-input" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="e.g. Senior React Devs Kigali" /></label>
            <label className="rec-form__label">Keyword<input className="auth-input" value={saveQ} onChange={(e) => setSaveQ(e.target.value)} /></label>
            <label className="rec-form__label">Skills <span className="muted small">(comma sep.)</span><input className="auth-input" value={saveSkills} onChange={(e) => setSaveSkills(e.target.value)} /></label>
            <label className="rec-form__label">Location<input className="auth-input" value={saveLocation} onChange={(e) => setSaveLocation(e.target.value)} /></label>
            <label className="rec-form__label">Availability
              <select className="auth-input" value={saveAvail} onChange={(e) => setSaveAvail(e.target.value)}>
                <option value="">Any</option>
                <option value="AVAILABLE">Available</option>
                <option value="OPEN_TO_OFFERS">Open to offers</option>
                <option value="NOT_LOOKING">Not looking</option>
              </select>
            </label>
            <label className="rec-form__label">Min years exp.<input className="auth-input" type="number" min="0" value={saveMinExp} onChange={(e) => setSaveMinExp(e.target.value)} /></label>
          </div>
          <div className="rec-form__actions" style={{ marginTop: '0.75rem' }}>
            <button className="btn btn--primary" onClick={onSave} disabled={saveBusy || !saveName.trim()}>{saveBusy ? 'Saving…' : 'Save search'}</button>
            <button className="btn btn--ghost" onClick={() => setShowSaveForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {!loading && searches.length === 0 && <div className="rec-empty"><p>No saved searches yet. Build one from your filters above.</p></div>}

      {!loading && searches.length > 0 && (
        <div className="tp-searches-list">
          {searches.map((s) => {
            const f = s.filters;
            const results = runResults[s.id];
            return (
              <div key={s.id} className="card tp-search-card">
                <div className="tp-search-card__header">
                  <div>
                    <div className="tp-search-card__name">{s.name}</div>
                    <div className="tp-search-card__filters muted small">
                      {f.q && <span>🔍 "{f.q}" </span>}
                      {f.skills?.length ? <span>Skills: {f.skills.join(', ')} </span> : null}
                      {f.location && <span>📍 {f.location} </span>}
                      {f.availabilityStatus && <span>Status: {f.availabilityStatus} </span>}
                      {f.minExperience !== undefined && <span>≥{f.minExperience} yrs exp. </span>}
                    </div>
                  </div>
                  <div className="tp-search-card__actions">
                    <button className="btn btn--primary" onClick={() => onRun(s.id)} disabled={runLoading === s.id}>
                      {runLoading === s.id ? 'Running…' : '▶ Run'}
                    </button>
                    <button className="btn btn--ghost" onClick={() => onDelete(s.id)}>Delete</button>
                  </div>
                </div>

                {results !== undefined && (
                  <div className="tp-search-card__results">
                    <div className="tp-search-card__result-count muted small">{results.length} result{results.length !== 1 ? 's' : ''}</div>
                    {results.length === 0 && <p className="muted small">No profiles match these filters right now.</p>}
                    <div className="tp-search-results-list">
                      {results.map((p) => (
                        <div key={p.id} className="tp-search-result-row">
                          <div className="candidate-card__avatar small-avatar">{p.firstName[0]}{p.lastName[0]}</div>
                          <div>
                            <div className="tp-search-result-row__name">{p.firstName} {p.lastName}</div>
                            <div className="muted small">{p.currentTitle ?? p.email}</div>
                          </div>
                          <div className="tp-search-result-row__skills">
                            {p.skills.slice(0, 3).map((sk) => <span key={sk} className="badge badge--gray">{sk}</span>)}
                          </div>
                          <span className={`badge ${p.availabilityStatus === 'AVAILABLE' ? 'badge--green' : p.availabilityStatus === 'OPEN_TO_OFFERS' ? 'badge--blue' : 'badge--gray'}`}>
                            {p.availabilityStatus.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
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

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  CandidateConflictError,
  createCandidateSafe,
  fetchCandidate,
  fetchCandidates,
  updateCandidate,
  type Candidate,
  type CandidateSource,
} from '../../recruitmentApi';
import { uploadViaPresign } from '../../documentApi';

const SOURCE_LABELS: Record<CandidateSource, string> = {
  E_WATU_PORTAL: 'E-Watu portal',
  WEBSITE: 'Website',
  MANUAL: 'Manual',
  REFERRAL: 'Referral',
  LINKEDIN: 'LinkedIn',
  WALK_IN: 'Walk-in',
  IMPORT: 'Import',
};

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterTags, setFilterTags] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<(Candidate & { applications: { id: string; stage: string; job: { title: string }; createdAt: string }[] }) | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [source, setSource] = useState<CandidateSource>('MANUAL');
  const [cvUrl, setCvUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    setErr(null);
    setExistingId(null);
    try {
      setCandidates(
        await fetchCandidates({
          q: search || undefined,
          source: filterSource || undefined,
          tags: filterTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filterSource, filterTags]);

  useEffect(() => { load(); }, [load]);

  const onSearch = (ev: FormEvent) => {
    ev.preventDefault();
    load(q.trim());
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        currentTitle: currentTitle.trim() || undefined,
        source,
        cvUrl: cvUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.length ? tags : undefined,
      };
      if (editingId) await updateCandidate(editingId, payload);
      else await createCandidateSafe(payload);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCurrentTitle('');
      setCvUrl('');
      setLinkedinUrl('');
      setNotes('');
      setShowForm(false);
      setEditingId(null);
      setTagsInput('');
      await load(q.trim() || undefined);
    } catch (e) {
      if (e instanceof CandidateConflictError) {
        setErr('A candidate with this email already exists');
        setExistingId(e.existingId ?? null);
      } else {
        setErr(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Candidates</h1>
          <p className="rec-page__sub">{candidates.length} in database</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add candidate'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}
      {existingId && (
        <div className="alert">
          <button type="button" className="btn btn--ghost small" onClick={() => void fetchCandidate(existingId).then(setDetail)}>
            View existing candidate
          </button>
        </div>
      )}

      <div className="rec-page__actions" style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select className="auth-input" value={filterSource} onChange={(e) => { setFilterSource(e.target.value); }} style={{ width: 'auto' }}>
          <option value="">All sources</option>
          {(Object.keys(SOURCE_LABELS) as CandidateSource[]).map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
        <input className="auth-input" placeholder="Filter by tags…" value={filterTags} onChange={(e) => setFilterTags(e.target.value)} style={{ minWidth: 140 }} />
        <button type="button" className="btn btn--ghost" onClick={() => load(q.trim() || undefined)}>Apply filters</button>
      </div>

      <form className="rec-search" onSubmit={onSearch}>
        <input
          className="auth-input rec-search__input"
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" type="submit">Search</button>
        {q && (
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => { setQ(''); load(); }}
          >
            Clear
          </button>
        )}
      </form>

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">New candidate</h2>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label">
                First name *
                <input
                  className="auth-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>
              <label className="rec-form__label">
                Last name *
                <input
                  className="auth-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>
              <label className="rec-form__label">
                Email *
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="rec-form__label">
                Phone
                <input
                  className="auth-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 7xx xxx xxx"
                />
              </label>
              <label className="rec-form__label">
                Current title
                <input
                  className="auth-input"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="e.g. HR Coordinator"
                />
              </label>
              <label className="rec-form__label">
                Source
                <select
                  className="auth-input"
                  value={source}
                  onChange={(e) => setSource(e.target.value as CandidateSource)}
                >
                  {(Object.keys(SOURCE_LABELS) as CandidateSource[]).map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                CV URL
                <input
                  className="auth-input"
                  type="url"
                  value={cvUrl}
                  onChange={(e) => setCvUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="rec-form__label">
                LinkedIn
                <input
                  className="auth-input"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/…"
                />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Tags <span className="muted small">(comma separated)</span>
                <input className="auth-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="senior, finance" />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Notes
                <textarea
                  className="auth-input rec-textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save candidate'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}

      {!loading && candidates.length === 0 && (
        <div className="rec-empty">
          <p>{q ? 'No candidates match your search.' : 'No candidates yet. Add your first one.'}</p>
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <div className="rec-candidates-grid">
          {candidates.map((c) => (
            <div key={c.id} className="candidate-card">
              <div className="candidate-card__avatar">
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="candidate-card__info">
                <button
                  type="button"
                  className="candidate-card__name"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  onClick={() => void fetchCandidate(c.id).then(setDetail)}
                >
                  {c.firstName} {c.lastName}
                </button>
                {c.currentTitle && (
                  <div className="candidate-card__role muted small">{c.currentTitle}</div>
                )}
                <div className="candidate-card__email muted small">{c.email}</div>
              </div>
              <div className="candidate-card__meta">
                <span className="badge badge--gray">{SOURCE_LABELS[c.source]}</span>
                {c.tags.length > 0 && (
                  <div className="candidate-card__tags">
                    {c.tags.map((t) => (
                      <span key={t} className="badge badge--teal">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="candidate-card__links">
                <button
                  type="button"
                  className="btn btn--ghost small"
                  onClick={() => {
                    setEditingId(c.id);
                    setFirstName(c.firstName);
                    setLastName(c.lastName);
                    setEmail(c.email);
                    setPhone(c.phone ?? '');
                    setCurrentTitle(c.currentTitle ?? '');
                    setSource(c.source);
                    setCvUrl(c.cvUrl ?? '');
                    setLinkedinUrl(c.linkedinUrl ?? '');
                    setNotes(c.notes ?? '');
                    setTagsInput(c.tags.join(', '));
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <label className="btn btn--ghost small">
                  Upload CV
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void (async () => {
                        setUploadPct(0);
                        const url = await uploadViaPresign(f, `candidates/${c.id}/${f.name}`, setUploadPct);
                        await updateCandidate(c.id, { cvUrl: url });
                        setUploadPct(null);
                        await load(q.trim() || undefined);
                      })();
                    }}
                  />
                </label>
                {uploadPct !== null && <span className="muted small">{uploadPct}%</span>}
                {c.cvUrl && (
                  <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">
                    CV ↗
                  </a>
                )}
                {c.linkedinUrl && (
                  <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">
                    LinkedIn ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">{detail.firstName} {detail.lastName}</h3>
            <p className="muted small">{detail.email}</p>
            <h4 style={{ marginTop: 12 }}>Applications</h4>
            <ul>
              {detail.applications.map((a) => (
                <li key={a.id} className="small">
                  {a.job.title} — {a.stage} ({new Date(a.createdAt).toLocaleDateString()})
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--ghost" onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

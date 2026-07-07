import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  CandidateConflictError,
  bulkImportCandidates,
  createCandidateSafe,
  fetchCandidate,
  fetchCandidates,
  updateCandidate,
  type Candidate,
  type CandidateAvailability,
  type CandidateSource,
  type CandidateStatus,
  type EmploymentStatus,
} from '../../recruitmentApi';
import { uploadViaPresign } from '../../documentApi';

// ── Label maps ────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<CandidateSource, string> = {
  E_WATU_PORTAL: 'E-Watu portal',
  WEBSITE: 'Website',
  MANUAL: 'Manual',
  REFERRAL: 'Referral',
  LINKEDIN: 'LinkedIn',
  WALK_IN: 'Walk-in',
  IMPORT: 'Import',
  PORTAL: 'Portal',
};

const STATUS_LABELS: Record<CandidateStatus, string> = {
  ACTIVE: 'Active',
  IN_PIPELINE: 'In pipeline',
  PLACED: 'Placed',
  PASSIVE: 'Passive',
  DO_NOT_CONTACT: 'Do not contact',
  ARCHIVED: 'Archived',
};

const STATUS_BADGE_CLASS: Record<CandidateStatus, string> = {
  ACTIVE: 'badge--green',
  IN_PIPELINE: 'badge--blue',
  PLACED: 'badge--purple',
  PASSIVE: 'badge--gray',
  DO_NOT_CONTACT: 'badge--red',
  ARCHIVED: 'badge--gray',
};

const AVAILABILITY_LABELS: Record<CandidateAvailability, string> = {
  IMMEDIATE: 'Immediate',
  FROM_DATE: 'From date',
  PASSIVE: 'Passive',
};

const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  EMPLOYED: 'Employed',
  UNEMPLOYED: 'Unemployed',
  FREELANCE: 'Freelance',
  STUDENT: 'Student',
};

// ── CSV parser ────────────────────────────────────────────────────────────────

type CsvRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  currentEmployer?: string;
};

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] ?? ''; });
    if (!obj.firstName || !obj.lastName || !obj.email) continue;
    rows.push({
      firstName: obj.firstName,
      lastName: obj.lastName,
      email: obj.email,
      phone: obj.phone || undefined,
      currentTitle: obj.currentTitle || undefined,
      currentEmployer: obj.currentEmployer || undefined,
    });
  }
  return rows;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CandidatesPage() {
  // list state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterTags, setFilterTags] = useState('');

  // create / edit form state
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // detail drawer
  const [detail, setDetail] = useState<
    (Candidate & { applications: { id: string; stage: string; job: { title: string }; createdAt: string }[] }) | null
  >(null);

  // cv upload
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  // bulk import modal
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // form fields — basic
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [source, setSource] = useState<CandidateSource>('MANUAL');
  const [cvUrl, setCvUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // form fields — extended
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | ''>('');
  const [availability, setAvailability] = useState<CandidateAvailability | ''>('');
  const [summary, setSummary] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');

  // ── data loading ──────────────────────────────────────────────────────────

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    setErr(null);
    setExistingId(null);
    try {
      setCandidates(
        await fetchCandidates({
          q: search || undefined,
          source: filterSource || undefined,
          status: filterStatus || undefined,
          availability: filterAvailability || undefined,
          country: filterCountry.trim() || undefined,
          tags: filterTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filterSource, filterStatus, filterAvailability, filterCountry, filterTags]);

  useEffect(() => { load(); }, [load]);

  const onSearch = (ev: FormEvent) => {
    ev.preventDefault();
    load(q.trim());
  };

  // ── helpers ───────────────────────────────────────────────────────────────

  function resetForm() {
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setCurrentTitle(''); setSource('MANUAL'); setCvUrl(''); setLinkedinUrl('');
    setNotes(''); setTagsInput(''); setGender(''); setNationality('');
    setCity(''); setCountry(''); setCurrentEmployer(''); setYearsExperience('');
    setEmploymentStatus(''); setAvailability(''); setSummary('');
    setSalaryMin(''); setSalaryMax(''); setSalaryCurrency('USD');
    setEditingId(null);
  }

  function openEdit(c: Candidate) {
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
    setGender(c.gender ?? '');
    setNationality(c.nationality ?? '');
    setCity(c.city ?? '');
    setCountry(c.country ?? '');
    setCurrentEmployer(c.currentEmployer ?? '');
    setYearsExperience(c.yearsExperience != null ? String(c.yearsExperience) : '');
    setEmploymentStatus(c.employmentStatus ?? '');
    setAvailability(c.availability ?? '');
    setSummary(c.summary ?? '');
    setSalaryMin(c.salaryMin != null ? String(c.salaryMin) : '');
    setSalaryMax(c.salaryMax != null ? String(c.salaryMax) : '');
    setSalaryCurrency(c.salaryCurrency ?? 'USD');
    setShowForm(true);
  }

  // ── create / edit submit ──────────────────────────────────────────────────

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
        currentEmployer: currentEmployer.trim() || undefined,
        source,
        cvUrl: cvUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.length ? tags : undefined,
        gender: gender.trim() || undefined,
        nationality: nationality.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        yearsExperience: yearsExperience !== '' ? Number(yearsExperience) : undefined,
        employmentStatus: employmentStatus || undefined,
        availability: availability || undefined,
        summary: summary.trim() || undefined,
        salaryMin: salaryMin !== '' ? Number(salaryMin) : undefined,
        salaryMax: salaryMax !== '' ? Number(salaryMax) : undefined,
        salaryCurrency: (salaryMin !== '' || salaryMax !== '') ? salaryCurrency : undefined,
      };
      if (editingId) await updateCandidate(editingId, payload);
      else await createCandidateSafe(payload);
      resetForm();
      setShowForm(false);
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

  // ── bulk import ───────────────────────────────────────────────────────────

  const onImportSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!importFile) return;
    setImportBusy(true);
    setImportErr(null);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setImportErr('No valid rows found. Make sure the CSV has firstName, lastName and email columns.');
        return;
      }
      const result = await bulkImportCandidates(rows);
      setImportResult(result);
      await load(q.trim() || undefined);
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : String(e));
    } finally {
      setImportBusy(false);
    }
  };

  function closeImport() {
    setShowImport(false);
    setImportFile(null);
    setImportResult(null);
    setImportErr(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="rec-page">
      {/* Header */}
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Candidates</h1>
          <p className="rec-page__sub">{candidates.length} in database</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--ghost"
            onClick={() => setShowImport(true)}
          >
            Bulk Import
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              if (showForm && !editingId) {
                resetForm();
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
          >
            {showForm && !editingId ? 'Cancel' : '+ Add candidate'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {err && <div className="alert alert--err">{err}</div>}
      {existingId && (
        <div className="alert">
          <button
            type="button"
            className="btn btn--ghost small"
            onClick={() => void fetchCandidate(existingId).then(setDetail)}
          >
            View existing candidate
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="rec-page__actions" style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select
          className="auth-input"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">All sources</option>
          {(Object.keys(SOURCE_LABELS) as CandidateSource[]).map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>

        <select
          className="auth-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as CandidateStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          className="auth-input"
          value={filterAvailability}
          onChange={(e) => setFilterAvailability(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">All availability</option>
          {(Object.keys(AVAILABILITY_LABELS) as CandidateAvailability[]).map((a) => (
            <option key={a} value={a}>{AVAILABILITY_LABELS[a]}</option>
          ))}
        </select>

        <input
          className="auth-input"
          placeholder="Filter by country…"
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          style={{ minWidth: 130 }}
        />

        <input
          className="auth-input"
          placeholder="Filter by tags…"
          value={filterTags}
          onChange={(e) => setFilterTags(e.target.value)}
          style={{ minWidth: 140 }}
        />

        <button type="button" className="btn btn--ghost" onClick={() => load(q.trim() || undefined)}>
          Apply filters
        </button>
      </div>

      {/* Search bar */}
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

      {/* Create / Edit form */}
      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">{editingId ? 'Edit candidate' : 'New candidate'}</h2>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              {/* Required fields */}
              <label className="rec-form__label">
                First name *
                <input className="auth-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
              <label className="rec-form__label">
                Last name *
                <input className="auth-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </label>
              <label className="rec-form__label">
                Email *
                <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="rec-form__label">
                Phone
                <input className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 7xx xxx xxx" />
              </label>
              <label className="rec-form__label">
                Current title
                <input className="auth-input" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} placeholder="e.g. HR Coordinator" />
              </label>
              <label className="rec-form__label">
                Current employer
                <input className="auth-input" value={currentEmployer} onChange={(e) => setCurrentEmployer(e.target.value)} placeholder="e.g. Acme Corp" />
              </label>
              <label className="rec-form__label">
                Source
                <select className="auth-input" value={source} onChange={(e) => setSource(e.target.value as CandidateSource)}>
                  {(Object.keys(SOURCE_LABELS) as CandidateSource[]).map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                Gender
                <select className="auth-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </label>
              <label className="rec-form__label">
                Nationality
                <input className="auth-input" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Rwandan" />
              </label>
              <label className="rec-form__label">
                City
                <input className="auth-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Kigali" />
              </label>
              <label className="rec-form__label">
                Country
                <input className="auth-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Rwanda" />
              </label>
              <label className="rec-form__label">
                Years of experience
                <input
                  className="auth-input"
                  type="number"
                  min={0}
                  max={60}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="e.g. 5"
                />
              </label>
              <label className="rec-form__label">
                Employment status
                <select className="auth-input" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus | '')}>
                  <option value="">Not specified</option>
                  {(Object.keys(EMPLOYMENT_STATUS_LABELS) as EmploymentStatus[]).map((s) => (
                    <option key={s} value={s}>{EMPLOYMENT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                Availability
                <select className="auth-input" value={availability} onChange={(e) => setAvailability(e.target.value as CandidateAvailability | '')}>
                  <option value="">Not specified</option>
                  {(Object.keys(AVAILABILITY_LABELS) as CandidateAvailability[]).map((a) => (
                    <option key={a} value={a}>{AVAILABILITY_LABELS[a]}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                CV URL
                <input className="auth-input" type="url" value={cvUrl} onChange={(e) => setCvUrl(e.target.value)} placeholder="https://…" />
              </label>
              <label className="rec-form__label">
                LinkedIn
                <input className="auth-input" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" />
              </label>

              {/* Salary expectation row */}
              <div className="rec-form__label rec-form__label--full" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <label style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column' }}>
                  Salary min
                  <input
                    className="auth-input"
                    type="number"
                    min={0}
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column' }}>
                  Salary max
                  <input
                    className="auth-input"
                    type="number"
                    min={0}
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label style={{ minWidth: 90, display: 'flex', flexDirection: 'column' }}>
                  Currency
                  <select className="auth-input" value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="RWF">RWF</option>
                    <option value="GBP">GBP</option>
                    <option value="KES">KES</option>
                    <option value="UGX">UGX</option>
                    <option value="TZS">TZS</option>
                  </select>
                </label>
              </div>

              <label className="rec-form__label rec-form__label--full">
                Tags <span className="muted small">(comma separated)</span>
                <input className="auth-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="senior, finance" />
              </label>

              <label className="rec-form__label rec-form__label--full">
                Summary
                <textarea
                  className="auth-input rec-textarea"
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief professional summary…"
                />
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
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
              >
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
                {(c.currentTitle || c.currentEmployer) && (
                  <div className="candidate-card__role muted small">
                    {c.currentTitle}
                    {c.currentTitle && c.currentEmployer && ' @ '}
                    {c.currentEmployer}
                  </div>
                )}
                <div className="candidate-card__email muted small">{c.email}</div>
                {c.yearsExperience != null && (
                  <div className="muted small">{c.yearsExperience} yr{c.yearsExperience !== 1 ? 's' : ''} exp</div>
                )}
              </div>
              <div className="candidate-card__meta">
                <span className="badge badge--gray">{SOURCE_LABELS[c.source]}</span>
                {c.status && (
                  <span className={`badge ${STATUS_BADGE_CLASS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                )}
                {c.availability && (
                  <span className="badge badge--teal">{AVAILABILITY_LABELS[c.availability]}</span>
                )}
                {c.tags.length > 0 && (
                  <div className="candidate-card__tags">
                    {c.tags.map((t) => (
                      <span key={t} className="badge badge--teal">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="candidate-card__links">
                <a
                  href={`/recruitment/candidates/${c.id}`}
                  className="btn btn--ghost small"
                >
                  View Profile
                </a>
                <button
                  type="button"
                  className="btn btn--ghost small"
                  onClick={() => openEdit(c)}
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
                    CV
                  </a>
                )}
                {c.linkedinUrl && (
                  <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">{detail.firstName} {detail.lastName}</h3>
            <p className="muted small">{detail.email}</p>
            {detail.status && (
              <span className={`badge ${STATUS_BADGE_CLASS[detail.status as CandidateStatus]}`} style={{ marginTop: 4, display: 'inline-block' }}>
                {STATUS_LABELS[detail.status as CandidateStatus]}
              </span>
            )}
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

      {/* Bulk Import modal */}
      {showImport && (
        <div className="modal-overlay" onClick={closeImport}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">Bulk Import Candidates</h3>
            <p className="muted small" style={{ marginBottom: 8 }}>
              Upload a CSV file with columns: <strong>firstName</strong>, <strong>lastName</strong>, <strong>email</strong>
              (required) and optionally <em>phone</em>, <em>currentTitle</em>, <em>currentEmployer</em>.
            </p>

            {importErr && <div className="alert alert--err" style={{ marginBottom: 8 }}>{importErr}</div>}

            {importResult ? (
              <div style={{ marginBottom: 16 }}>
                <div className="alert alert--ok" style={{ marginBottom: 8 }}>
                  Import complete: <strong>{importResult.created}</strong> created,{' '}
                  <strong>{importResult.skipped}</strong> skipped,{' '}
                  <strong>{importResult.errors}</strong> errors.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn--primary" onClick={closeImport}>Done</button>
                  <button type="button" className="btn btn--ghost" onClick={() => {
                    setImportResult(null);
                    setImportFile(null);
                    if (csvInputRef.current) csvInputRef.current.value = '';
                  }}>Import another</button>
                </div>
              </div>
            ) : (
              <form onSubmit={onImportSubmit}>
                <label className="rec-form__label" style={{ display: 'block', marginBottom: 12 }}>
                  CSV file *
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="auth-input"
                    style={{ marginTop: 4 }}
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </label>
                {importFile && (
                  <p className="muted small" style={{ marginBottom: 8 }}>Selected: {importFile.name}</p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn--primary" disabled={importBusy || !importFile}>
                    {importBusy ? 'Importing…' : 'Import'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={closeImport}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

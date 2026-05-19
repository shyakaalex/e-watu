import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createProfile, fetchProfiles, deleteProfile,
  type AvailabilityStatus, type CandidateProfile, type ProfileSearchFilters,
} from '../../talentPoolApi';

const AVAIL_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Available',
  OPEN_TO_OFFERS: 'Open to offers',
  NOT_LOOKING: 'Not looking',
  UNKNOWN: 'Unknown',
};
const AVAIL_BADGE: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'badge--green',
  OPEN_TO_OFFERS: 'badge--blue',
  NOT_LOOKING: 'badge--red',
  UNKNOWN: 'badge--gray',
};

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  // filter state
  const [q, setQ] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [minExp, setMinExp] = useState('');

  // new profile form state
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [loc, setLoc] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formTags, setFormTags] = useState('');
  const [summary, setSummary] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [formAvail, setFormAvail] = useState<AvailabilityStatus>('UNKNOWN');

  const buildFilters = (): ProfileSearchFilters => ({
    q: q.trim() || undefined,
    skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
    tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    location: location.trim() || undefined,
    availabilityStatus: availability || undefined,
    minExperience: minExp ? parseInt(minExp, 10) : undefined,
  });

  const load = useCallback(async (filters?: ProfileSearchFilters) => {
    setLoading(true); setErr(null);
    try { setProfiles(await fetchProfiles(filters)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSearch = (ev: FormEvent) => { ev.preventDefault(); load(buildFilters()); };
  const onClear = () => {
    setQ(''); setSkillsInput(''); setTagsInput(''); setLocation(''); setAvailability(''); setMinExp('');
    load();
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault(); setBusy(true); setErr(null);
    try {
      await createProfile({
        firstName: fn.trim(), lastName: ln.trim(), email: email.trim(),
        phone: phone.trim() || undefined, currentTitle: title.trim() || undefined,
        location: loc.trim() || undefined, summary: summary.trim() || undefined,
        cvUrl: cvUrl.trim() || undefined, linkedinUrl: linkedinUrl.trim() || undefined,
        skills: formSkills.split(',').map((s) => s.trim()).filter(Boolean),
        tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
        yearsExperience: yearsExp ? parseInt(yearsExp, 10) : undefined,
        availabilityStatus: formAvail,
      });
      setFn(''); setLn(''); setEmail(''); setPhone(''); setTitle(''); setLoc('');
      setFormSkills(''); setFormTags(''); setSummary(''); setCvUrl(''); setLinkedinUrl('');
      setYearsExp(''); setFormAvail('UNKNOWN'); setShowForm(false);
      await load(buildFilters());
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Remove this profile from the talent pool?')) return;
    try { await deleteProfile(id); await load(buildFilters()); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Talent Profiles</h1>
          <p className="rec-page__sub">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add profile'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {/* Search / filter bar */}
      <form className="tp-filter-bar card" onSubmit={onSearch}>
        <div className="tp-filter-bar__grid">
          <input className="auth-input" placeholder="Name, email, title, summary…" value={q} onChange={(e) => setQ(e.target.value)} />
          <input className="auth-input" placeholder="Skills (comma separated)" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
          <input className="auth-input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <select className="auth-input" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">Any availability</option>
            {(Object.keys(AVAIL_LABELS) as AvailabilityStatus[]).map((s) => (
              <option key={s} value={s}>{AVAIL_LABELS[s]}</option>
            ))}
          </select>
          <input className="auth-input" type="number" min="0" placeholder="Min years exp." value={minExp} onChange={(e) => setMinExp(e.target.value)} />
          <input className="auth-input" placeholder="Tags (comma separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
        </div>
        <div className="rec-form__actions" style={{ marginTop: '0.75rem' }}>
          <button className="btn btn--primary" type="submit">Search</button>
          <button className="btn btn--ghost" type="button" onClick={onClear}>Clear</button>
        </div>
      </form>

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">New talent profile</h2>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label">First name *<input className="auth-input" value={fn} onChange={(e) => setFn(e.target.value)} required /></label>
              <label className="rec-form__label">Last name *<input className="auth-input" value={ln} onChange={(e) => setLn(e.target.value)} required /></label>
              <label className="rec-form__label">Email *<input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <label className="rec-form__label">Phone<input className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 7xx…" /></label>
              <label className="rec-form__label">Current title<input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label className="rec-form__label">Location<input className="auth-input" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Kigali" /></label>
              <label className="rec-form__label">Years of experience<input className="auth-input" type="number" min="0" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} /></label>
              <label className="rec-form__label">Availability
                <select className="auth-input" value={formAvail} onChange={(e) => setFormAvail(e.target.value as AvailabilityStatus)}>
                  {(Object.keys(AVAIL_LABELS) as AvailabilityStatus[]).map((s) => <option key={s} value={s}>{AVAIL_LABELS[s]}</option>)}
                </select>
              </label>
              <label className="rec-form__label">Skills <span className="muted small">(comma sep.)</span><input className="auth-input" value={formSkills} onChange={(e) => setFormSkills(e.target.value)} placeholder="React, NestJS, SQL" /></label>
              <label className="rec-form__label">Tags <span className="muted small">(comma sep.)</span><input className="auth-input" value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="senior, remote-ok" /></label>
              <label className="rec-form__label">CV URL<input className="auth-input" type="url" value={cvUrl} onChange={(e) => setCvUrl(e.target.value)} /></label>
              <label className="rec-form__label">LinkedIn<input className="auth-input" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} /></label>
              <label className="rec-form__label rec-form__label--full">Summary<textarea className="auth-input rec-textarea" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
              <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {!loading && profiles.length === 0 && <div className="rec-empty"><p>No profiles match. Try different filters or add a new profile.</p></div>}

      {!loading && profiles.length > 0 && (
        <div className="rec-candidates-grid">
          {profiles.map((p) => (
            <div key={p.id} className="candidate-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="candidate-card__avatar">{p.firstName[0]}{p.lastName[0]}</div>
                <div>
                  <div className="candidate-card__name">{p.firstName} {p.lastName}</div>
                  {p.currentTitle && <div className="muted small">{p.currentTitle}</div>}
                </div>
              </div>
              <div className="candidate-card__email muted small">{p.email}</div>
              {p.location && <div className="muted small">📍 {p.location}</div>}
              {p.yearsExperience !== null && <div className="muted small">{p.yearsExperience} yr{p.yearsExperience !== 1 ? 's' : ''} experience</div>}
              <div className="candidate-card__meta">
                <span className={`badge ${AVAIL_BADGE[p.availabilityStatus]}`}>{AVAIL_LABELS[p.availabilityStatus]}</span>
              </div>
              {p.skills.length > 0 && (
                <div className="candidate-card__tags">
                  {p.skills.slice(0, 4).map((s) => <span key={s} className="badge badge--gray">{s}</span>)}
                  {p.skills.length > 4 && <span className="muted small">+{p.skills.length - 4}</span>}
                </div>
              )}
              <div className="candidate-card__links">
                {p.cvUrl && <a href={p.cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">CV ↗</a>}
                {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">LinkedIn ↗</a>}
                <button className="btn btn--ghost small" onClick={() => onDelete(p.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

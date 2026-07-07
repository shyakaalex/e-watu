import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchCandidate,
  updateCandidate,
  type Application,
  type ApplicationStage,
  type Candidate,
  type Job,
} from '../../recruitmentApi';
import { uploadViaPresign } from '../../documentApi';

// ── Extended local types ───────────────────────────────────────────────────

type CandidateStatus =
  | 'ACTIVE'
  | 'IN_PIPELINE'
  | 'PLACED'
  | 'PASSIVE'
  | 'DO_NOT_CONTACT'
  | 'ARCHIVED';

type WorkEntry = {
  id: string;
  employer: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  responsibilities: string;
};

type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
};

type LanguageProficiency = 'NATIVE' | 'FLUENT' | 'CONVERSATIONAL' | 'BASIC';

type LanguageEntry = {
  id: string;
  language: string;
  proficiency: LanguageProficiency;
};

type AvailabilityType = 'IMMEDIATE' | 'FROM_DATE' | 'PASSIVE';

type SalaryInfo = {
  min: number | null;
  max: number | null;
  currency: string;
  availability: AvailabilityType;
  availableFrom: string | null;
};

type CvDocument = {
  id: string;
  name: string;
  url: string;
  version: number;
  uploadedAt: string;
};

type RecruiterNote = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

type ActivityEvent = {
  id: string;
  type:
    | 'STATUS_CHANGE'
    | 'NOTE_ADDED'
    | 'CV_UPLOADED'
    | 'APPLICATION_CREATED'
    | 'STAGE_MOVED'
    | 'TAG_UPDATED';
  description: string;
  createdAt: string;
};

type DetailedCandidate = Candidate & {
  applications: (Application & { job: Job })[];
  // Extended profile fields (stored in the notes field as JSON blob or managed locally)
  status?: CandidateStatus;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  city?: string;
  country?: string;
  contactPreference?: string;
  communicationLanguage?: string;
  employmentStatus?: string;
  currentEmployer?: string;
  yearsExperience?: number;
  professionalSummary?: string;
  workHistory?: WorkEntry[];
  education?: EducationEntry[];
  languages?: LanguageEntry[];
  salary?: SalaryInfo;
  documents?: CvDocument[];
  recruiterNotes?: RecruiterNote[];
  activities?: ActivityEvent[];
};

// ── Constants ─────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'work'
  | 'education'
  | 'skills'
  | 'salary'
  | 'documents'
  | 'notes'
  | 'activity'
  | 'applications';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'work', label: 'Work History' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills & Languages' },
  { id: 'salary', label: 'Salary & Availability' },
  { id: 'documents', label: 'CV & Documents' },
  { id: 'notes', label: 'Notes' },
  { id: 'activity', label: 'Activity' },
  { id: 'applications', label: 'Applications' },
];

const STATUS_LABELS: Record<CandidateStatus, string> = {
  ACTIVE: 'Active',
  IN_PIPELINE: 'In Pipeline',
  PLACED: 'Placed',
  PASSIVE: 'Passive',
  DO_NOT_CONTACT: 'Do Not Contact',
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

const STAGE_BADGE_CLASS: Record<ApplicationStage, string> = {
  APPLIED: 'badge--gray',
  SCREENED: 'badge--teal',
  SHORTLISTED: 'badge--blue',
  INTERVIEWED: 'badge--blue',
  OFFERED: 'badge--orange',
  PLACED: 'badge--purple',
  REJECTED: 'badge--red',
};

const STAGE_LABELS: Record<ApplicationStage, string> = {
  APPLIED: 'Applied',
  SCREENED: 'Screened',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWED: 'Interviewed',
  OFFERED: 'Offered',
  PLACED: 'Placed',
  REJECTED: 'Rejected',
};

const LANG_BADGE: Record<LanguageProficiency, string> = {
  NATIVE: 'badge--green',
  FLUENT: 'badge--blue',
  CONVERSATIONAL: 'badge--orange',
  BASIC: 'badge--gray',
};

const AVAILABILITY_BADGE: Record<AvailabilityType, string> = {
  IMMEDIATE: 'badge--green',
  FROM_DATE: 'badge--blue',
  PASSIVE: 'badge--gray',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

// Attempt to parse extended profile data from the notes field (a JSON envelope)
function parseExtended(candidate: Candidate & { applications: (Application & { job: Job })[] }): DetailedCandidate {
  let extended: Partial<DetailedCandidate> = {};
  if (candidate.notes) {
    try {
      const parsed = JSON.parse(candidate.notes) as Partial<DetailedCandidate>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        extended = parsed;
      }
    } catch {
      // notes is plain text, leave extended empty
    }
  }
  return {
    ...candidate,
    status: extended.status ?? 'ACTIVE',
    gender: extended.gender ?? '',
    dateOfBirth: extended.dateOfBirth ?? '',
    nationality: extended.nationality ?? '',
    city: extended.city ?? '',
    country: extended.country ?? '',
    contactPreference: extended.contactPreference ?? '',
    communicationLanguage: extended.communicationLanguage ?? '',
    employmentStatus: extended.employmentStatus ?? '',
    currentEmployer: extended.currentEmployer ?? '',
    yearsExperience: extended.yearsExperience ?? undefined,
    professionalSummary: extended.professionalSummary ?? '',
    workHistory: extended.workHistory ?? [],
    education: extended.education ?? [],
    languages: extended.languages ?? [],
    salary: extended.salary ?? {
      min: null,
      max: null,
      currency: 'RWF',
      availability: 'ACTIVE' as unknown as AvailabilityType,
      availableFrom: null,
    },
    documents: extended.documents ?? [],
    recruiterNotes: extended.recruiterNotes ?? [],
    activities: extended.activities ?? [],
  };
}

// Serialize extended fields back into notes (JSON envelope)
function serializeExtended(detail: DetailedCandidate): string {
  const {
    status,
    gender,
    dateOfBirth,
    nationality,
    city,
    country,
    contactPreference,
    communicationLanguage,
    employmentStatus,
    currentEmployer,
    yearsExperience,
    professionalSummary,
    workHistory,
    education,
    languages,
    salary,
    documents,
    recruiterNotes,
    activities,
  } = detail;
  return JSON.stringify({
    status,
    gender,
    dateOfBirth,
    nationality,
    city,
    country,
    contactPreference,
    communicationLanguage,
    employmentStatus,
    currentEmployer,
    yearsExperience,
    professionalSummary,
    workHistory,
    education,
    languages,
    salary,
    documents,
    recruiterNotes,
    activities,
  });
}

// ── Main component ─────────────────────────────────────────────────────────

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DetailedCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const raw = await fetchCandidate(id);
      setDetail(parseExtended(raw));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Persist extended fields via updateCandidate
  const persist = useCallback(
    async (updated: DetailedCandidate) => {
      if (!id) return;
      setSaving(true);
      setSaveErr(null);
      try {
        await updateCandidate(id, {
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
          phone: updated.phone ?? undefined,
          currentTitle: updated.currentTitle ?? undefined,
          linkedinUrl: updated.linkedinUrl ?? undefined,
          cvUrl: updated.cvUrl ?? undefined,
          tags: updated.tags,
          notes: serializeExtended(updated),
        });
        setDetail(updated);
      } catch (e) {
        setSaveErr(e instanceof Error ? e.message : String(e));
      } finally {
        setSaving(false);
      }
    },
    [id],
  );

  // ── Status change ────────────────────────────────────────────────────────

  const onStatusChange = async (newStatus: CandidateStatus) => {
    if (!detail) return;
    const updated: DetailedCandidate = { ...detail, status: newStatus };
    await persist(updated);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rec-page">
        <p className="muted">Loading candidate…</p>
      </div>
    );
  }

  if (err || !detail) {
    return (
      <div className="rec-page">
        {err && <div className="alert alert--err">{err}</div>}
        <Link to="/recruitment/candidates" className="btn btn--ghost">
          ← Back to candidates
        </Link>
      </div>
    );
  }

  const candidateStatus: CandidateStatus = detail.status ?? 'ACTIVE';

  return (
    <div className="rec-page">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="rec-page__header" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate('/recruitment/candidates')}
          >
            ← Back
          </button>
          <div
            className="candidate-card__avatar"
            style={{ width: 52, height: 52, fontSize: '1.15rem', flexShrink: 0 }}
          >
            {initials(detail.firstName, detail.lastName)}
          </div>
          <div>
            <h1 className="rec-page__title" style={{ marginBottom: 4 }}>
              {detail.firstName} {detail.lastName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {detail.currentTitle && (
                <span className="muted small">{detail.currentTitle}</span>
              )}
              <span className={`badge ${STATUS_BADGE_CLASS[candidateStatus]}`} style={{ fontStyle: 'normal' }}>
                {STATUS_LABELS[candidateStatus]}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="rec-form__label" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <span className="muted small">Status:</span>
            <select
              className="auth-input"
              value={candidateStatus}
              onChange={(e) => void onStatusChange(e.target.value as CandidateStatus)}
              style={{ width: 'auto', fontSize: '0.87rem', padding: '0.3rem 0.6rem' }}
            >
              {(Object.keys(STATUS_LABELS) as CandidateStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          {saving && <span className="muted small">Saving…</span>}
        </div>
      </div>

      {saveErr && <div className="alert alert--err">{saveErr}</div>}

      {/* ── Tab navigation ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '2px solid var(--line)',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-2px',
              padding: '0.55rem 0.9rem',
              fontSize: '0.88rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--ink-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab panels ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <OverviewTab detail={detail} onSave={persist} />
      )}
      {activeTab === 'work' && (
        <WorkHistoryTab detail={detail} onSave={persist} />
      )}
      {activeTab === 'education' && (
        <EducationTab detail={detail} onSave={persist} />
      )}
      {activeTab === 'skills' && (
        <SkillsLanguagesTab detail={detail} onSave={persist} />
      )}
      {activeTab === 'salary' && (
        <SalaryAvailabilityTab detail={detail} onSave={persist} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab detail={detail} onSave={persist} candidateId={id ?? ''} />
      )}
      {activeTab === 'notes' && (
        <NotesTab detail={detail} onSave={persist} />
      )}
      {activeTab === 'activity' && (
        <ActivityTab detail={detail} />
      )}
      {activeTab === 'applications' && (
        <ApplicationsTab detail={detail} />
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab({
  detail,
  onSave,
}: {
  detail: DetailedCandidate;
  onSave: (d: DetailedCandidate) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // form state
  const [firstName, setFirstName] = useState(detail.firstName);
  const [lastName, setLastName] = useState(detail.lastName);
  const [email, setEmail] = useState(detail.email);
  const [phone, setPhone] = useState(detail.phone ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(detail.linkedinUrl ?? '');
  const [gender, setGender] = useState(detail.gender ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(detail.dateOfBirth ?? '');
  const [nationality, setNationality] = useState(detail.nationality ?? '');
  const [city, setCity] = useState(detail.city ?? '');
  const [country, setCountry] = useState(detail.country ?? '');
  const [contactPreference, setContactPreference] = useState(detail.contactPreference ?? '');
  const [communicationLanguage, setCommunicationLanguage] = useState(detail.communicationLanguage ?? '');
  const [employmentStatus, setEmploymentStatus] = useState(detail.employmentStatus ?? '');
  const [currentEmployer, setCurrentEmployer] = useState(detail.currentEmployer ?? '');
  const [currentTitle, setCurrentTitle] = useState(detail.currentTitle ?? '');
  const [yearsExperience, setYearsExperience] = useState(
    detail.yearsExperience !== undefined ? String(detail.yearsExperience) : '',
  );
  const [professionalSummary, setProfessionalSummary] = useState(detail.professionalSummary ?? '');

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    const updated: DetailedCandidate = {
      ...detail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      linkedinUrl: linkedinUrl.trim() || null,
      currentTitle: currentTitle.trim() || null,
      gender: gender.trim(),
      dateOfBirth: dateOfBirth.trim(),
      nationality: nationality.trim(),
      city: city.trim(),
      country: country.trim(),
      contactPreference: contactPreference.trim(),
      communicationLanguage: communicationLanguage.trim(),
      employmentStatus: employmentStatus.trim(),
      currentEmployer: currentEmployer.trim(),
      yearsExperience: yearsExperience.trim() ? Number(yearsExperience) : undefined,
      professionalSummary: professionalSummary.trim(),
    };
    await onSave(updated);
    setBusy(false);
    setEditing(false);
  };

  const onCancel = () => {
    setFirstName(detail.firstName);
    setLastName(detail.lastName);
    setEmail(detail.email);
    setPhone(detail.phone ?? '');
    setLinkedinUrl(detail.linkedinUrl ?? '');
    setGender(detail.gender ?? '');
    setDateOfBirth(detail.dateOfBirth ?? '');
    setNationality(detail.nationality ?? '');
    setCity(detail.city ?? '');
    setCountry(detail.country ?? '');
    setContactPreference(detail.contactPreference ?? '');
    setCommunicationLanguage(detail.communicationLanguage ?? '');
    setEmploymentStatus(detail.employmentStatus ?? '');
    setCurrentEmployer(detail.currentEmployer ?? '');
    setCurrentTitle(detail.currentTitle ?? '');
    setYearsExperience(detail.yearsExperience !== undefined ? String(detail.yearsExperience) : '');
    setProfessionalSummary(detail.professionalSummary ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="card rec-form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="rec-form-card__title" style={{ margin: 0 }}>Edit profile</h2>
        </div>
        <form className="rec-form" onSubmit={onSubmit}>
          <div className="rec-form__grid">
            <p className="rec-form__section-title">Personal Information</p>
            <label className="rec-form__label">
              First name <span className="rec-form__req">*</span>
              <input className="auth-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label className="rec-form__label">
              Last name <span className="rec-form__req">*</span>
              <input className="auth-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
            <label className="rec-form__label">
              Email <span className="rec-form__req">*</span>
              <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="rec-form__label">
              Phone
              <input className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 7xx xxx xxx" />
            </label>
            <label className="rec-form__label">
              LinkedIn URL
              <input className="auth-input" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" />
            </label>
            <label className="rec-form__label">
              Gender
              <select className="auth-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">— select —</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
            <label className="rec-form__label">
              Date of birth
              <input className="auth-input" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
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
              Contact preference
              <select className="auth-input" value={contactPreference} onChange={(e) => setContactPreference(e.target.value)}>
                <option value="">— select —</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </label>
            <label className="rec-form__label">
              Communication language
              <input className="auth-input" value={communicationLanguage} onChange={(e) => setCommunicationLanguage(e.target.value)} placeholder="e.g. English" />
            </label>

            <p className="rec-form__section-title">Professional Information</p>
            <label className="rec-form__label">
              Employment status
              <select className="auth-input" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
                <option value="">— select —</option>
                <option value="Employed">Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Student">Student</option>
                <option value="Contractor">Contractor</option>
              </select>
            </label>
            <label className="rec-form__label">
              Current employer
              <input className="auth-input" value={currentEmployer} onChange={(e) => setCurrentEmployer(e.target.value)} placeholder="Company name" />
            </label>
            <label className="rec-form__label">
              Current title
              <input className="auth-input" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} placeholder="e.g. HR Coordinator" />
            </label>
            <label className="rec-form__label">
              Years of experience
              <input className="auth-input" type="number" min="0" max="60" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="0" />
            </label>
            <label className="rec-form__label rec-form__label--full">
              Professional summary
              <textarea
                className="auth-input rec-textarea"
                rows={4}
                value={professionalSummary}
                onChange={(e) => setProfessionalSummary(e.target.value)}
                placeholder="Brief professional background…"
              />
            </label>
          </div>
          <div className="rec-form__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button className="btn btn--ghost" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>
          Edit profile
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column */}
        <div>
          <div className="card">
            <p className="rec-section-title" style={{ marginTop: 0 }}>Contact Information</p>
            <InfoRow label="Email">{detail.email}</InfoRow>
            <InfoRow label="Phone">{detail.phone ?? '—'}</InfoRow>
            <InfoRow label="LinkedIn">
              {detail.linkedinUrl ? (
                <a href={detail.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  {detail.linkedinUrl}
                </a>
              ) : '—'}
            </InfoRow>
            <InfoRow label="Contact preference">{detail.contactPreference || '—'}</InfoRow>
            <InfoRow label="Communication language">{detail.communicationLanguage || '—'}</InfoRow>
          </div>

          <div className="card">
            <p className="rec-section-title" style={{ marginTop: 0 }}>Personal Details</p>
            <InfoRow label="Gender">{detail.gender || '—'}</InfoRow>
            <InfoRow label="Date of birth">{detail.dateOfBirth ? fmtDate(detail.dateOfBirth) : '—'}</InfoRow>
            <InfoRow label="Nationality">{detail.nationality || '—'}</InfoRow>
            <InfoRow label="Location">
              {[detail.city, detail.country].filter(Boolean).join(', ') || '—'}
            </InfoRow>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="card">
            <p className="rec-section-title" style={{ marginTop: 0 }}>Professional Details</p>
            <InfoRow label="Employment status">{detail.employmentStatus || '—'}</InfoRow>
            <InfoRow label="Current employer">{detail.currentEmployer || '—'}</InfoRow>
            <InfoRow label="Current title">{detail.currentTitle || '—'}</InfoRow>
            <InfoRow label="Years experience">
              {detail.yearsExperience !== undefined ? `${detail.yearsExperience} yrs` : '—'}
            </InfoRow>
          </div>

          {detail.professionalSummary && (
            <div className="card">
              <p className="rec-section-title" style={{ marginTop: 0 }}>Professional Summary</p>
              <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.92rem', color: 'var(--ink)' }}>
                {detail.professionalSummary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Work History Tab ──────────────────────────────────────────────────────

function WorkHistoryTab({
  detail,
  onSave,
}: {
  detail: DetailedCandidate;
  onSave: (d: DetailedCandidate) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [employer, setEmployer] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [responsibilities, setResponsibilities] = useState('');

  const resetForm = () => {
    setEmployer('');
    setTitle('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setResponsibilities('');
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (entry: WorkEntry) => {
    setEditingId(entry.id);
    setEmployer(entry.employer);
    setTitle(entry.title);
    setStartDate(entry.startDate);
    setEndDate(entry.endDate ?? '');
    setIsCurrent(entry.isCurrent);
    setResponsibilities(entry.responsibilities);
    setShowForm(true);
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    const entry: WorkEntry = {
      id: editingId ?? uid(),
      employer: employer.trim(),
      title: title.trim(),
      startDate: startDate.trim(),
      endDate: isCurrent ? null : (endDate.trim() || null),
      isCurrent,
      responsibilities: responsibilities.trim(),
    };
    const existing = detail.workHistory ?? [];
    const updated = editingId
      ? existing.map((e) => (e.id === editingId ? entry : e))
      : [...existing, entry];
    await onSave({ ...detail, workHistory: updated });
    setBusy(false);
    resetForm();
  };

  const onDelete = async (entryId: string) => {
    if (!window.confirm('Delete this work entry?')) return;
    const updated = (detail.workHistory ?? []).filter((e) => e.id !== entryId);
    await onSave({ ...detail, workHistory: updated });
  };

  const entries = detail.workHistory ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="rec-form-card__title" style={{ margin: 0 }}>Work History</h2>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add entry'}
        </button>
      </div>

      {showForm && (
        <div className="card rec-form-card">
          <h3 className="rec-form-card__title">{editingId ? 'Edit entry' : 'New entry'}</h3>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label">
                Employer <span className="rec-form__req">*</span>
                <input className="auth-input" value={employer} onChange={(e) => setEmployer(e.target.value)} required />
              </label>
              <label className="rec-form__label">
                Title <span className="rec-form__req">*</span>
                <input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label className="rec-form__label">
                Start date <span className="rec-form__req">*</span>
                <input className="auth-input" type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label className="rec-form__label">
                End date
                <input
                  className="auth-input"
                  type="month"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isCurrent}
                />
              </label>
              <label className="rec-form__label rec-form__label--full" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
                Currently working here
              </label>
              <label className="rec-form__label rec-form__label--full">
                Responsibilities
                <textarea
                  className="auth-input rec-textarea"
                  rows={3}
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Update' : 'Add'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="rec-empty">
          <p>No work history added yet.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {entries.map((entry) => (
          <div key={entry.id} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.97rem' }}>{entry.title}</span>
                  {entry.isCurrent && <span className="badge badge--green">Current</span>}
                </div>
                <div className="muted small">{entry.employer}</div>
                <div className="muted small">
                  {entry.startDate}
                  {' — '}
                  {entry.isCurrent ? 'Present' : (entry.endDate ?? '—')}
                </div>
                {entry.responsibilities && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    {entry.responsibilities}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <button type="button" className="btn btn--ghost small" onClick={() => openEdit(entry)}>Edit</button>
                <button type="button" className="btn btn--ghost small" style={{ color: '#dc2626' }} onClick={() => void onDelete(entry.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Education Tab ─────────────────────────────────────────────────────────

function EducationTab({
  detail,
  onSave,
}: {
  detail: DetailedCandidate;
  onSave: (d: DetailedCandidate) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [field, setField] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const resetForm = () => {
    setInstitution('');
    setDegree('');
    setField('');
    setStartYear('');
    setEndYear('');
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (entry: EducationEntry) => {
    setEditingId(entry.id);
    setInstitution(entry.institution);
    setDegree(entry.degree);
    setField(entry.field);
    setStartYear(entry.startYear);
    setEndYear(entry.endYear);
    setShowForm(true);
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    const entry: EducationEntry = {
      id: editingId ?? uid(),
      institution: institution.trim(),
      degree: degree.trim(),
      field: field.trim(),
      startYear: startYear.trim(),
      endYear: endYear.trim(),
    };
    const existing = detail.education ?? [];
    const updated = editingId
      ? existing.map((e) => (e.id === editingId ? entry : e))
      : [...existing, entry];
    await onSave({ ...detail, education: updated });
    setBusy(false);
    resetForm();
  };

  const onDelete = async (entryId: string) => {
    if (!window.confirm('Delete this education entry?')) return;
    const updated = (detail.education ?? []).filter((e) => e.id !== entryId);
    await onSave({ ...detail, education: updated });
  };

  const entries = detail.education ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="rec-form-card__title" style={{ margin: 0 }}>Education</h2>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add entry'}
        </button>
      </div>

      {showForm && (
        <div className="card rec-form-card">
          <h3 className="rec-form-card__title">{editingId ? 'Edit entry' : 'New entry'}</h3>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label">
                Institution <span className="rec-form__req">*</span>
                <input className="auth-input" value={institution} onChange={(e) => setInstitution(e.target.value)} required />
              </label>
              <label className="rec-form__label">
                Degree <span className="rec-form__req">*</span>
                <input className="auth-input" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. Bachelor's" required />
              </label>
              <label className="rec-form__label">
                Field of study
                <input className="auth-input" value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. Computer Science" />
              </label>
              <label className="rec-form__label">
                Start year
                <input className="auth-input" type="number" min="1950" max="2100" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="2018" />
              </label>
              <label className="rec-form__label">
                End year
                <input className="auth-input" type="number" min="1950" max="2100" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="2022" />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Update' : 'Add'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="rec-empty">
          <p>No education entries added yet.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {entries.map((entry) => (
          <div key={entry.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.97rem', marginBottom: '0.15rem' }}>
                  {entry.degree}{entry.field ? ` in ${entry.field}` : ''}
                </div>
                <div className="muted small">{entry.institution}</div>
                <div className="muted small">
                  {[entry.startYear, entry.endYear].filter(Boolean).join(' — ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <button type="button" className="btn btn--ghost small" onClick={() => openEdit(entry)}>Edit</button>
                <button type="button" className="btn btn--ghost small" style={{ color: '#dc2626' }} onClick={() => void onDelete(entry.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skills & Languages Tab ────────────────────────────────────────────────

function SkillsLanguagesTab({
  detail,
  onSave,
}: {
  detail: DetailedCandidate;
  onSave: (d: DetailedCandidate) => Promise<void>;
}) {
  const [tagInput, setTagInput] = useState('');
  const [langName, setLangName] = useState('');
  const [langProf, setLangProf] = useState<LanguageProficiency>('CONVERSATIONAL');
  const [busy, setBusy] = useState(false);

  const onAddTag = async (ev: FormEvent) => {
    ev.preventDefault();
    const tag = tagInput.trim();
    if (!tag) return;
    if (detail.tags.includes(tag)) {
      setTagInput('');
      return;
    }
    setBusy(true);
    await onSave({ ...detail, tags: [...detail.tags, tag] });
    setTagInput('');
    setBusy(false);
  };

  const onRemoveTag = async (tag: string) => {
    await onSave({ ...detail, tags: detail.tags.filter((t) => t !== tag) });
  };

  const onAddLanguage = async (ev: FormEvent) => {
    ev.preventDefault();
    const name = langName.trim();
    if (!name) return;
    setBusy(true);
    const entry: LanguageEntry = { id: uid(), language: name, proficiency: langProf };
    await onSave({ ...detail, languages: [...(detail.languages ?? []), entry] });
    setLangName('');
    setLangProf('CONVERSATIONAL');
    setBusy(false);
  };

  const onRemoveLanguage = async (langId: string) => {
    await onSave({ ...detail, languages: (detail.languages ?? []).filter((l) => l.id !== langId) });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Skills */}
      <div>
        <h2 className="rec-form-card__title">Skills</h2>
        <div className="card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', minHeight: 40, marginBottom: '1rem' }}>
            {detail.tags.length === 0 && <span className="muted small">No skills added yet.</span>}
            {detail.tags.map((tag) => (
              <span
                key={tag}
                className="badge badge--teal"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => void onRemoveTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 0 0 2px',
                    color: 'inherit',
                    fontSize: '0.8rem',
                    lineHeight: 1,
                    fontFamily: 'inherit',
                  }}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={onAddTag} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="auth-input"
              placeholder="Add skill…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn--primary" type="submit" disabled={busy || !tagInput.trim()}>
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Languages */}
      <div>
        <h2 className="rec-form-card__title">Languages</h2>
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {(detail.languages ?? []).length === 0 && <span className="muted small">No languages added yet.</span>}
            {(detail.languages ?? []).map((lang) => (
              <div
                key={lang.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
              >
                <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{lang.language}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className={`badge ${LANG_BADGE[lang.proficiency]}`}>{lang.proficiency}</span>
                  <button
                    type="button"
                    className="btn btn--ghost small"
                    style={{ color: '#dc2626', padding: '0.1rem 0.4rem' }}
                    onClick={() => void onRemoveLanguage(lang.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={onAddLanguage} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              className="auth-input"
              placeholder="Language…"
              value={langName}
              onChange={(e) => setLangName(e.target.value)}
              style={{ flex: 1, minWidth: 100 }}
            />
            <select
              className="auth-input"
              value={langProf}
              onChange={(e) => setLangProf(e.target.value as LanguageProficiency)}
              style={{ width: 'auto' }}
            >
              <option value="NATIVE">Native</option>
              <option value="FLUENT">Fluent</option>
              <option value="CONVERSATIONAL">Conversational</option>
              <option value="BASIC">Basic</option>
            </select>
            <button className="btn btn--primary" type="submit" disabled={busy || !langName.trim()}>
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Salary & Availability Tab ─────────────────────────────────────────────

function SalaryAvailabilityTab({
  detail,
  onSave,
}: {
  detail: DetailedCandidate;
  onSave: (d: DetailedCandidate) => Promise<void>;
}) {
  const sal = detail.salary ?? {
    min: null,
    max: null,
    currency: 'RWF',
    availability: 'PASSIVE' as AvailabilityType,
    availableFrom: null,
  };

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [minVal, setMinVal] = useState(sal.min !== null ? String(sal.min) : '');
  const [maxVal, setMaxVal] = useState(sal.max !== null ? String(sal.max) : '');
  const [currency, setCurrency] = useState(sal.currency);
  const [availability, setAvailability] = useState<AvailabilityType>(sal.availability ?? 'PASSIVE');
  const [availableFrom, setAvailableFrom] = useState(sal.availableFrom ?? '');

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    const updated: SalaryInfo = {
      min: minVal.trim() ? Number(minVal) : null,
      max: maxVal.trim() ? Number(maxVal) : null,
      currency: currency.trim() || 'RWF',
      availability,
      availableFrom: availability === 'FROM_DATE' ? availableFrom : null,
    };
    await onSave({ ...detail, salary: updated });
    setBusy(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="card rec-form-card">
        <h2 className="rec-form-card__title">Edit salary &amp; availability</h2>
        <form className="rec-form" onSubmit={onSubmit}>
          <div className="rec-form__grid">
            <label className="rec-form__label">
              Min salary
              <input className="auth-input" type="number" min="0" value={minVal} onChange={(e) => setMinVal(e.target.value)} placeholder="0" />
            </label>
            <label className="rec-form__label">
              Max salary
              <input className="auth-input" type="number" min="0" value={maxVal} onChange={(e) => setMaxVal(e.target.value)} placeholder="0" />
            </label>
            <label className="rec-form__label">
              Currency
              <input className="auth-input" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="RWF" />
            </label>
            <label className="rec-form__label">
              Availability
              <select className="auth-input" value={availability} onChange={(e) => setAvailability(e.target.value as AvailabilityType)}>
                <option value="IMMEDIATE">Immediate</option>
                <option value="FROM_DATE">From a specific date</option>
                <option value="PASSIVE">Passive (not actively looking)</option>
              </select>
            </label>
            {availability === 'FROM_DATE' && (
              <label className="rec-form__label">
                Available from
                <input className="auth-input" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
              </label>
            )}
          </div>
          <div className="rec-form__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  const avail = sal.availability ?? 'PASSIVE';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h2 className="rec-form-card__title" style={{ margin: 0 }}>Salary &amp; Availability</h2>
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>Edit</button>
      </div>

      <InfoRow label="Salary expectation">
        {sal.min !== null || sal.max !== null ? (
          <span>
            {sal.min !== null ? sal.min.toLocaleString() : '?'}
            {' — '}
            {sal.max !== null ? sal.max.toLocaleString() : '?'}
            {' '}
            {sal.currency}
          </span>
        ) : '—'}
      </InfoRow>
      <InfoRow label="Availability">
        <span className={`badge ${AVAILABILITY_BADGE[avail] ?? 'badge--gray'}`}>
          {avail === 'IMMEDIATE'
            ? 'Immediate'
            : avail === 'FROM_DATE'
            ? `From ${sal.availableFrom ? fmtDate(sal.availableFrom) : '—'}`
            : 'Passive'}
        </span>
      </InfoRow>
    </div>
  );
}

// ── CV & Documents Tab ────────────────────────────────────────────────────

function DocumentsTab({
  detail,
  onSave,
  candidateId,
}: {
  detail: DetailedCandidate;
  onSave: (d: DetailedCandidate) => Promise<void>;
  candidateId: string;
}) {
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const docs = detail.documents ?? [];
  const sortedDocs = [...docs].sort((a, b) => b.version - a.version);
  const latestDoc = sortedDocs[0] ?? null;

  const onUpload = async (file: File) => {
    setUploadErr(null);
    setUploadPct(0);
    try {
      const objectKey = `candidates/${candidateId}/cv-v${docs.length + 1}-${file.name}`;
      const url = await uploadViaPresign(file, objectKey, setUploadPct);
      const newDoc: CvDocument = {
        id: uid(),
        name: file.name,
        url,
        version: docs.length + 1,
        uploadedAt: new Date().toISOString(),
      };
      const updated = [...docs, newDoc];
      await onSave({ ...detail, cvUrl: url, documents: updated });
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploadPct(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="rec-form-card__title" style={{ margin: 0 }}>CV &amp; Documents</h2>
        <label className="btn btn--primary" style={{ cursor: 'pointer' }}>
          Upload new CV
          <input
            type="file"
            hidden
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {uploadErr && <div className="alert alert--err">{uploadErr}</div>}
      {uploadPct !== null && (
        <div className="alert alert--info" style={{ marginBottom: '1rem' }}>
          Uploading… {uploadPct}%
        </div>
      )}

      {latestDoc && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p className="rec-section-title" style={{ marginTop: 0 }}>Most Recent CV</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 600 }}>{latestDoc.name}</span>
              <span className="muted small" style={{ marginLeft: '0.5rem' }}>
                v{latestDoc.version} · {fmtDate(latestDoc.uploadedAt)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={latestDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost small"
              >
                View ↗
              </a>
              <a
                href={latestDoc.url}
                download={latestDoc.name}
                className="btn btn--ghost small"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Also show the cvUrl on the candidate if no documents stored locally */}
      {docs.length === 0 && detail.cvUrl && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p className="rec-section-title" style={{ marginTop: 0 }}>Linked CV</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href={detail.cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">
              View CV ↗
            </a>
            <a href={detail.cvUrl} download className="btn btn--ghost small">
              Download
            </a>
          </div>
        </div>
      )}

      {sortedDocs.length > 0 && (
        <div>
          <p className="rec-section-title">Version History</p>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Name</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="badge badge--gray">v{doc.version}</span>
                    </td>
                    <td style={{ fontSize: '0.88rem' }}>{doc.name}</td>
                    <td className="muted small">{fmtDate(doc.uploadedAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn--ghost small">
                          View ↗
                        </a>
                        <a href={doc.url} download={doc.name} className="btn btn--ghost small">
                          Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {docs.length === 0 && !detail.cvUrl && (
        <div className="rec-empty">
          <p>No documents uploaded yet. Upload a CV to get started.</p>
        </div>
      )}
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────

function NotesTab({
  detail,
  onSave,
}: {
  detail: DetailedCandidate;
  onSave: (d: DetailedCandidate) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const notes = [...(detail.recruiterNotes ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const text = content.trim();
    if (!text) return;
    setBusy(true);
    const newNote: RecruiterNote = {
      id: uid(),
      author: 'You',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const newActivity: ActivityEvent = {
      id: uid(),
      type: 'NOTE_ADDED',
      description: 'Note added',
      createdAt: new Date().toISOString(),
    };
    await onSave({
      ...detail,
      recruiterNotes: [...(detail.recruiterNotes ?? []), newNote],
      activities: [...(detail.activities ?? []), newActivity],
    });
    setContent('');
    setBusy(false);
  };

  const onDelete = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return;
    await onSave({
      ...detail,
      recruiterNotes: (detail.recruiterNotes ?? []).filter((n) => n.id !== noteId),
    });
  };

  return (
    <div>
      <h2 className="rec-form-card__title">Recruiter Notes</h2>

      <div className="card rec-form-card">
        <form className="rec-form" onSubmit={onSubmit}>
          <label className="rec-form__label">
            Add a note
            <textarea
              className="auth-input rec-textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a note about this candidate…"
            />
          </label>
          <div className="rec-form__actions">
            <button className="btn btn--primary" type="submit" disabled={busy || !content.trim()}>
              {busy ? 'Saving…' : 'Add note'}
            </button>
          </div>
        </form>
      </div>

      {notes.length === 0 && (
        <div className="rec-empty">
          <p>No notes yet. Add the first one above.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notes.map((note) => (
          <div key={note.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <div className="muted small" style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>{note.author}</span>
                  {' · '}
                  {fmtDate(note.createdAt)}
                </div>
                <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: '0.92rem' }}>
                  {note.content}
                </p>
              </div>
              <button
                type="button"
                className="btn btn--ghost small"
                style={{ color: '#dc2626', flexShrink: 0 }}
                onClick={() => void onDelete(note.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<ActivityEvent['type'], string> = {
  STATUS_CHANGE: '🔄',
  NOTE_ADDED: '📝',
  CV_UPLOADED: '📎',
  APPLICATION_CREATED: '📋',
  STAGE_MOVED: '➡️',
  TAG_UPDATED: '🏷️',
};

function ActivityTab({ detail }: { detail: DetailedCandidate }) {
  const events = [...(detail.activities ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (events.length === 0) {
    return (
      <div>
        <h2 className="rec-form-card__title">Activity Timeline</h2>
        <div className="rec-empty">
          <p>No activity recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="rec-form-card__title">Activity Timeline</h2>
      <div className="card">
        <ul className="timeline-list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map((ev) => (
            <li
              key={ev.id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--line)' }}
            >
              <span style={{ fontSize: '1.15rem', lineHeight: 1, marginTop: '0.1rem', flexShrink: 0 }}>
                {ACTIVITY_ICON[ev.type]}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.92rem' }}>{ev.description}</span>
                <div className="muted small">{fmtDate(ev.createdAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────

function ApplicationsTab({ detail }: { detail: DetailedCandidate }) {
  const apps = detail.applications ?? [];

  return (
    <div>
      <h2 className="rec-form-card__title">Applications ({apps.length})</h2>

      {apps.length === 0 && (
        <div className="rec-empty">
          <p>No applications found for this candidate.</p>
        </div>
      )}

      {apps.length > 0 && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Job title</th>
                <th>Stage</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.job.title}</td>
                  <td>
                    <span className={`badge ${STAGE_BADGE_CLASS[app.stage]}`}>
                      {STAGE_LABELS[app.stage]}
                    </span>
                  </td>
                  <td className="muted small">{fmtDate(app.createdAt)}</td>
                  <td>
                    <Link
                      to={`/recruitment/jobs/${app.jobId}`}
                      className="btn btn--ghost small"
                    >
                      View pipeline →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.4rem 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--ink-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          flexShrink: 0,
          minWidth: 140,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '0.92rem', textAlign: 'right', wordBreak: 'break-all' }}>
        {children}
      </span>
    </div>
  );
}

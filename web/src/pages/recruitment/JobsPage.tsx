import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createJob,
  deleteJob,
  fetchJobs,
  updateJob,
  type FeeType,
  type Job,
  type JobPriority,
  type JobStatus,
  type JobType,
} from '../../recruitmentApi';

const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

const PRIORITY_CLASS: Record<JobPriority, string> = {
  STANDARD: 'badge badge--gray',
  URGENT: 'badge badge--orange',
  EXECUTIVE: 'badge badge--purple',
};

const STATUS_CLASS: Record<JobStatus, string> = {
  DRAFT: 'badge badge--gray',
  OPEN: 'badge badge--green',
  IN_PROGRESS: 'badge badge--blue',
  ON_HOLD: 'badge badge--orange',
  FILLED: 'badge badge--blue',
  CANCELLED: 'badge badge--red',
};

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  FILLED: 'Filled',
  CANCELLED: 'Cancelled',
};

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<JobType>('FULL_TIME');
  const [status, setStatus] = useState<JobStatus>('OPEN');
  const [priority, setPriority] = useState<JobPriority>('STANDARD');
  const [description, setDescription] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [headcount, setHeadcount] = useState('1');
  const [feeType, setFeeType] = useState<FeeType | ''>('');
  const [feeValue, setFeeValue] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setJobs(
        await fetchJobs({
          ...(filterStatus ? { status: filterStatus } : {}),
          ...(filterPriority ? { priority: filterPriority } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        }),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (job: Job) => {
    setEditingId(job.id);
    setTitle(job.title);
    setDepartment(job.department ?? '');
    setLocation(job.location ?? '');
    setType(job.type);
    setStatus(job.status);
    setPriority(job.priority);
    setDescription(job.description ?? '');
    setQualifications(job.qualifications ?? '');
    setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : '');
    setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : '');
    setDeadline(job.deadline ? job.deadline.slice(0, 10) : '');
    setRequiredSkills(job.requiredSkills.join(', '));
    setClientName(job.clientName ?? '');
    setClientId(job.clientId ?? '');
    setConsultantId(job.consultantId ?? '');
    setHeadcount(String(job.headcount));
    setFeeType(job.feeType ?? '');
    setFeeValue(job.feeValue != null ? String(job.feeValue) : '');
    setShowForm(true);
  };

  const resetForm = () => {
    setTitle(''); setDepartment(''); setLocation(''); setDescription('');
    setQualifications(''); setSalaryMin(''); setSalaryMax(''); setDeadline('');
    setRequiredSkills(''); setClientName(''); setClientId(''); setConsultantId('');
    setHeadcount('1'); setFeeType(''); setFeeValue('');
    setPriority('STANDARD'); setType('FULL_TIME'); setStatus('OPEN');
    setEditingId(null);
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const skills = requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        department: department.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        qualifications: qualifications.trim() || undefined,
        type,
        status,
        priority,
        salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
        currency: 'RWF',
        headcount: parseInt(headcount, 10) || 1,
        deadline: deadline || undefined,
        requiredSkills: skills.length > 0 ? skills : undefined,
        clientName: clientName.trim() || undefined,
        clientId: clientId.trim() || undefined,
        consultantId: consultantId.trim() || undefined,
        feeType: feeType || undefined,
        feeValue: feeValue ? parseFloat(feeValue) : undefined,
      };
      if (editingId) await updateJob(editingId, payload);
      else await createJob(payload);
      resetForm();
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const displayed = jobs;

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Jobs</h1>
          <p className="rec-page__sub">{displayed.length} position{displayed.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rec-page__actions">
          <select
            className="auth-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABELS) as JobStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            className="auth-input"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ width: 'auto', minWidth: 120 }}
          >
            <option value="">All priorities</option>
            <option value="STANDARD">Standard</option>
            <option value="URGENT">Urgent</option>
            <option value="EXECUTIVE">Executive</option>
          </select>
          <input
            className="auth-input"
            placeholder="Search title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          />
          <button type="button" className="btn btn--primary" onClick={() => { resetForm(); setShowForm((v) => !v); }}>
            {showForm ? 'Cancel' : '+ New job'}
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">{editingId ? 'Edit job order' : 'Post a new job order'}</h2>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Job title *
                <input
                  className="auth-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Senior HR Officer"
                />
              </label>
              <label className="rec-form__label">
                Client / Company
                <input
                  className="auth-input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Ltd"
                />
              </label>
              <label className="rec-form__label">
                Client ID
                <input className="auth-input" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="UUID" />
              </label>
              <label className="rec-form__label">
                Consultant ID
                <input className="auth-input" value={consultantId} onChange={(e) => setConsultantId(e.target.value)} placeholder="UUID" />
              </label>
              <label className="rec-form__label">
                Headcount
                <input className="auth-input" type="number" min="1" value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
              </label>
              <label className="rec-form__label">
                Department
                <input
                  className="auth-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Finance"
                />
              </label>
              <label className="rec-form__label">
                Location
                <input
                  className="auth-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kigali, Rwanda"
                />
              </label>
              <label className="rec-form__label">
                Job type
                <select className="auth-input" value={type} onChange={(e) => setType(e.target.value as JobType)}>
                  {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((t) => (
                    <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                Priority
                <select className="auth-input" value={priority} onChange={(e) => setPriority(e.target.value as JobPriority)}>
                  <option value="STANDARD">Standard</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </label>
              <label className="rec-form__label">
                Status
                <select className="auth-input" value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}>
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open (publish now)</option>
                </select>
              </label>
              <label className="rec-form__label">
                Application deadline
                <input
                  className="auth-input"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
              <label className="rec-form__label">
                Min salary (RWF)
                <input
                  className="auth-input"
                  type="number"
                  min="0"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g. 300000"
                />
              </label>
              <label className="rec-form__label">
                Max salary (RWF)
                <input
                  className="auth-input"
                  type="number"
                  min="0"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="e.g. 600000"
                />
              </label>
              <label className="rec-form__label">
                Fee type
                <select className="auth-input" value={feeType} onChange={(e) => setFeeType(e.target.value as FeeType | '')}>
                  <option value="">— select —</option>
                  <option value="PERCENTAGE">% of annual salary</option>
                  <option value="FLAT_FEE">Flat fee</option>
                  <option value="MONTHLY_RETAINER">Monthly retainer</option>
                </select>
              </label>
              <label className="rec-form__label">
                Fee value
                <input
                  className="auth-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={feeValue}
                  onChange={(e) => setFeeValue(e.target.value)}
                  placeholder={feeType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 500000'}
                  disabled={!feeType}
                />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Required skills (comma-separated)
                <input
                  className="auth-input"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="e.g. HR management, HRIS, Labour law"
                />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Job description
                <textarea
                  className="auth-input rec-textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Role responsibilities and requirements…"
                />
              </label>
              <label className="rec-form__label rec-form__label--full">
                Qualifications
                <textarea
                  className="auth-input rec-textarea"
                  rows={3}
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="Minimum education and experience requirements…"
                />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy || !title.trim()}>
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create job order'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading jobs…</p>}

      {!loading && displayed.length === 0 && (
        <div className="rec-empty">
          <p>No jobs yet. Create your first job order above.</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="rec-jobs-list">
          {displayed.map((job) => (
            <div key={job.id} className="rec-job-card">
              <div className="rec-job-card__top">
                <div>
                  <div className="rec-job-card__title">{job.title}</div>
                  <div className="rec-job-card__meta">
                    {job.clientName && <span className="muted">{job.clientName}</span>}
                    {job.department && <span>· {job.department}</span>}
                    {job.location && <span>· {job.location}</span>}
                    <span>· {JOB_TYPE_LABELS[job.type]}</span>
                  </div>
                </div>
                <div className="rec-job-card__badges">
                  <span className={PRIORITY_CLASS[job.priority]}>{job.priority}</span>
                  <span className={STATUS_CLASS[job.status]}>{STATUS_LABELS[job.status]}</span>
                </div>
              </div>
              {job.requiredSkills.length > 0 && (
                <div className="rec-job-card__skills">
                  {job.requiredSkills.slice(0, 4).map((s) => (
                    <span key={s} className="tag">{s}</span>
                  ))}
                  {job.requiredSkills.length > 4 && (
                    <span className="muted small">+{job.requiredSkills.length - 4} more</span>
                  )}
                </div>
              )}
              <div className="rec-job-card__footer">
                <div>
                  {(job.salaryMin || job.salaryMax) && (
                    <span className="muted small">
                      {job.salaryMin && job.salaryMax
                        ? `${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} ${job.currency}`
                        : job.salaryMin
                        ? `From ${job.salaryMin.toLocaleString()} ${job.currency}`
                        : `Up to ${job.salaryMax!.toLocaleString()} ${job.currency}`}
                    </span>
                  )}
                  {job.deadline && (
                    <span className="muted small"> · Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                  )}
                </div>
                <span className="muted small">Headcount: {job.headcount}</span>
              </div>
              <div className="rec-job-card__footer" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Link to={`/recruitment/jobs/${job.id}`} className="btn btn--primary small">Pipeline</Link>
                <button type="button" className="btn btn--ghost small" onClick={() => startEdit(job)}>Edit</button>
                {job.status === 'DRAFT' && (
                  <button
                    type="button"
                    className="btn btn--ghost small"
                    onClick={async () => {
                      if (!confirm('Delete this draft job?')) return;
                      await deleteJob(job.id);
                      await load();
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

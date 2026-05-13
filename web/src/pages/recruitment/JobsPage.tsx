import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createJob,
  fetchJobs,
  type Job,
  type JobStatus,
  type JobType,
} from '../../recruitmentApi';

const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

const STATUS_CLASS: Record<JobStatus, string> = {
  DRAFT: 'badge badge--gray',
  OPEN: 'badge badge--green',
  CLOSED: 'badge badge--red',
  FILLED: 'badge badge--blue',
};

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<JobType>('FULL_TIME');
  const [status, setStatus] = useState<JobStatus>('OPEN');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setJobs(await fetchJobs());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await createJob({
        title: title.trim(),
        department: department.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        type,
        status,
        salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
        currency: 'RWF',
      });
      setTitle('');
      setDepartment('');
      setLocation('');
      setDescription('');
      setSalaryMin('');
      setSalaryMax('');
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Jobs</h1>
          <p className="rec-page__sub">{jobs.length} position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : '+ New job'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">Post a new job</h2>
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
                Type
                <select
                  className="auth-input"
                  value={type}
                  onChange={(e) => setType(e.target.value as JobType)}
                >
                  {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((t) => (
                    <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                Status
                <select
                  className="auth-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open (publish now)</option>
                </select>
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
              <label className="rec-form__label rec-form__label--full">
                Description
                <textarea
                  className="auth-input rec-textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Role responsibilities, requirements…"
                />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Create job'}
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading jobs…</p>}

      {!loading && jobs.length === 0 && (
        <div className="rec-empty">
          <p>No jobs yet. Create your first position above.</p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="rec-jobs-list">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/recruitment/jobs/${job.id}`}
              className="rec-job-card"
            >
              <div className="rec-job-card__top">
                <div>
                  <div className="rec-job-card__title">{job.title}</div>
                  <div className="rec-job-card__meta">
                    {job.department && <span>{job.department}</span>}
                    {job.location && <span>· {job.location}</span>}
                    <span>· {JOB_TYPE_LABELS[job.type]}</span>
                  </div>
                </div>
                <span className={STATUS_CLASS[job.status]}>{job.status}</span>
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <div className="rec-job-card__salary">
                  {job.salaryMin && job.salaryMax
                    ? `${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} ${job.currency}`
                    : job.salaryMin
                    ? `From ${job.salaryMin.toLocaleString()} ${job.currency}`
                    : `Up to ${job.salaryMax!.toLocaleString()} ${job.currency}`}
                </div>
              )}
              <div className="rec-job-card__footer">
                <span className="muted small">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
                <span className="rec-job-card__cta">View pipeline →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createInterview,
  fetchApplications,
  fetchInterviews,
  updateInterview,
  type Application,
  type Interview,
  type InterviewStatus,
  type InterviewType,
} from '../../recruitmentApi';

const TYPE_LABELS: Record<InterviewType, string> = {
  PHONE: 'Phone',
  VIDEO: 'Video',
  ONSITE: 'On-site',
  PANEL: 'Panel',
};

const STATUS_CLASS: Record<InterviewStatus, string> = {
  SCHEDULED: 'badge badge--green',
  COMPLETED: 'badge badge--blue',
  CANCELLED: 'badge badge--red',
  NO_SHOW: 'badge badge--gray',
};

export function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMin, setDurationMin] = useState('60');
  const [type, setType] = useState<InterviewType>('VIDEO');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setInterviews(await fetchInterviews());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onOpenForm = async () => {
    setShowForm(true);
    setErr(null);
    try {
      const apps = await fetchApplications();
      setApplications(apps.filter((a) => a.stage !== 'HIRED' && a.stage !== 'REJECTED'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await createInterview({
        applicationId: selectedApp,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMin: parseInt(durationMin, 10),
        type,
      });
      setSelectedApp('');
      setScheduledAt('');
      setDurationMin('60');
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onMarkStatus = async (id: string, status: InterviewStatus) => {
    setErr(null);
    try {
      await updateInterview(id, { status });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const upcoming = interviews.filter((i) => i.status === 'SCHEDULED');
  const past = interviews.filter((i) => i.status !== 'SCHEDULED');

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Interviews</h1>
          <p className="rec-page__sub">
            {upcoming.length} upcoming · {past.length} completed
          </p>
        </div>
        <button className="btn btn--primary" onClick={onOpenForm}>
          + Schedule interview
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <h2 className="rec-form-card__title">Schedule an interview</h2>
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Application (candidate + job) *
                <select
                  className="auth-input"
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  required
                >
                  <option value="">— select application —</option>
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.candidate.firstName} {a.candidate.lastName} → {a.job.title} [{a.stage}]
                    </option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">
                Date & time *
                <input
                  className="auth-input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </label>
              <label className="rec-form__label">
                Duration (min)
                <input
                  className="auth-input"
                  type="number"
                  min="15"
                  max="480"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                />
              </label>
              <label className="rec-form__label">
                Type
                <select
                  className="auth-input"
                  value={type}
                  onChange={(e) => setType(e.target.value as InterviewType)}
                >
                  {(Object.keys(TYPE_LABELS) as InterviewType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Schedule'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}

      {!loading && interviews.length === 0 && (
        <div className="rec-empty">
          <p>No interviews scheduled yet.</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <section>
          <h2 className="rec-section-title">Upcoming</h2>
          <div className="rec-interviews-list">
            {upcoming.map((i) => (
              <InterviewRow key={i.id} interview={i} onMarkStatus={onMarkStatus} />
            ))}
          </div>
        </section>
      )}

      {!loading && past.length > 0 && (
        <section>
          <h2 className="rec-section-title">Past</h2>
          <div className="rec-interviews-list">
            {past.map((i) => (
              <InterviewRow key={i.id} interview={i} onMarkStatus={onMarkStatus} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InterviewRow({
  interview,
  onMarkStatus,
}: {
  interview: Interview;
  onMarkStatus: (id: string, status: InterviewStatus) => void;
}) {
  const { application: app } = interview;
  return (
    <div className="interview-row card">
      <div className="interview-row__main">
        <div className="interview-row__who">
          <span className="interview-row__name">
            {app.candidate.firstName} {app.candidate.lastName}
          </span>
          <span className="muted small"> for </span>
          <span className="interview-row__job">{app.job.title}</span>
        </div>
        <div className="interview-row__when muted small">
          {new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMin} min ·{' '}
          {TYPE_LABELS[interview.type]}
        </div>
      </div>
      <div className="interview-row__right">
        <span className={STATUS_CLASS[interview.status]}>{interview.status}</span>
        {interview.status === 'SCHEDULED' && (
          <div className="interview-row__actions">
            <button
              className="btn btn--ghost small"
              onClick={() => onMarkStatus(interview.id, 'COMPLETED')}
            >
              Mark done
            </button>
            <button
              className="btn btn--ghost small"
              onClick={() => onMarkStatus(interview.id, 'CANCELLED')}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

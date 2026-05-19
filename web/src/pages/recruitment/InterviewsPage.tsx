import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  addScorecard,
  createInterview,
  fetchApplications,
  fetchInterviews,
  fetchScorecards,
  updateInterview,
  type Application,
  type Interview,
  type InterviewOutcome,
  type InterviewScorecard,
  type InterviewStatus,
  type InterviewType,
} from '../../recruitmentApi';

const TYPE_LABELS: Record<InterviewType, string> = {
  PHONE: 'Phone',
  VIDEO: 'Video',
  IN_PERSON: 'In-Person',
  PANEL: 'Panel',
  TECHNICAL: 'Technical',
};

const STATUS_CLASS: Record<InterviewStatus, string> = {
  SCHEDULED: 'badge badge--green',
  COMPLETED: 'badge badge--blue',
  CANCELLED: 'badge badge--red',
  NO_SHOW: 'badge badge--gray',
};

const OUTCOME_LABELS: Record<InterviewOutcome, string> = {
  ADVANCE: 'Advance',
  HOLD: 'Hold',
  SECOND_ROUND: 'Second Round',
  OFFER: 'Offer',
  REJECT: 'Reject',
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
  const [locationOrLink, setLocationOrLink] = useState('');

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
      setApplications(apps.filter((a) => a.stage !== 'PLACED' && a.stage !== 'REJECTED'));
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
        locationOrLink: locationOrLink.trim() || undefined,
      });
      setSelectedApp(''); setScheduledAt(''); setDurationMin('60'); setLocationOrLink('');
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

  const onRecordOutcome = async (id: string, outcome: InterviewOutcome) => {
    setErr(null);
    try {
      await updateInterview(id, { status: 'COMPLETED', outcome });
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
              <label className="rec-form__label rec-form__label--full">
                Location / Video link
                <input
                  className="auth-input"
                  value={locationOrLink}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                  placeholder={type === 'VIDEO' ? 'e.g. https://meet.google.com/…' : 'e.g. Room 3, HC Solutions HQ'}
                />
              </label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy || !selectedApp}>
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
        <div className="rec-empty"><p>No interviews scheduled yet.</p></div>
      )}

      {!loading && upcoming.length > 0 && (
        <section>
          <h2 className="rec-section-title">Upcoming</h2>
          <div className="rec-interviews-list">
            {upcoming.map((i) => (
              <InterviewRow
                key={i.id}
                interview={i}
                onMarkStatus={onMarkStatus}
                onRecordOutcome={onRecordOutcome}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && past.length > 0 && (
        <section>
          <h2 className="rec-section-title">Past</h2>
          <div className="rec-interviews-list">
            {past.map((i) => (
              <InterviewRow
                key={i.id}
                interview={i}
                onMarkStatus={onMarkStatus}
                onRecordOutcome={onRecordOutcome}
              />
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
  onRecordOutcome,
}: {
  interview: Interview;
  onMarkStatus: (id: string, status: InterviewStatus) => void;
  onRecordOutcome: (id: string, outcome: InterviewOutcome) => void;
}) {
  const { application: app } = interview;
  const [showScorecard, setShowScorecard] = useState(false);
  const [scorecardData, setScorecardData] = useState<{
    scorecards: InterviewScorecard[];
    byCompetency: Record<string, { scores: number[]; avg: number }>;
    overallAvg: number | null;
  } | null>(null);
  const [competency, setCompetency] = useState('');
  const [score, setScore] = useState('3');
  const [scoreNote, setScoreNote] = useState('');
  const [scoreBusy, setScoreBusy] = useState(false);
  const [scoreErr, setScoreErr] = useState<string | null>(null);

  const loadScorecards = async () => {
    try {
      setScorecardData(await fetchScorecards(interview.id));
    } catch {
      setScoreErr('Failed to load scorecards');
    }
  };

  const onToggleScorecard = async () => {
    if (!showScorecard) await loadScorecards();
    setShowScorecard((v) => !v);
  };

  const onAddScore = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!competency.trim()) return;
    setScoreBusy(true);
    setScoreErr(null);
    try {
      await addScorecard(interview.id, {
        competency: competency.trim(),
        score: parseInt(score, 10),
        notes: scoreNote.trim() || undefined,
      });
      setCompetency(''); setScore('3'); setScoreNote('');
      await loadScorecards();
    } catch (e) {
      setScoreErr(e instanceof Error ? e.message : String(e));
    } finally {
      setScoreBusy(false);
    }
  };

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
          {TYPE_LABELS[interview.type as InterviewType]}
          {interview.locationOrLink && (
            <span> · {interview.locationOrLink.startsWith('http')
              ? <a href={interview.locationOrLink} target="_blank" rel="noreferrer">Join link</a>
              : interview.locationOrLink}
            </span>
          )}
        </div>
        {interview.outcome && (
          <div className="interview-row__outcome">
            <span className="badge badge--blue">Outcome: {OUTCOME_LABELS[interview.outcome as InterviewOutcome]}</span>
          </div>
        )}
      </div>
      <div className="interview-row__right">
        <span className={STATUS_CLASS[interview.status as InterviewStatus]}>{interview.status}</span>
        <div className="interview-row__actions">
          {interview.status === 'SCHEDULED' && (
            <>
              <button className="btn btn--ghost small" onClick={() => onMarkStatus(interview.id, 'CANCELLED')}>
                Cancel
              </button>
              <div className="interview-outcome-menu">
                <span className="muted small">Outcome:</span>
                {(Object.keys(OUTCOME_LABELS) as InterviewOutcome[]).map((o) => (
                  <button
                    key={o}
                    className="btn btn--ghost small"
                    onClick={() => onRecordOutcome(interview.id, o)}
                  >
                    {OUTCOME_LABELS[o]}
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="btn btn--ghost small" onClick={onToggleScorecard}>
            {showScorecard ? 'Hide scorecard' : 'Scorecard'}
          </button>
        </div>
      </div>

      {showScorecard && (
        <div className="scorecard-panel">
          {scoreErr && <div className="alert alert--err">{scoreErr}</div>}
          {scorecardData && scorecardData.scorecards.length > 0 && (
            <div className="scorecard-results">
              <table className="scorecard-table">
                <thead>
                  <tr>
                    <th>Competency</th>
                    <th>Avg score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(scorecardData.byCompetency).map(([comp, { avg }]) => (
                    <tr key={comp}>
                      <td>{comp}</td>
                      <td>
                        <span className="score-badge">{avg}/5</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {scorecardData.overallAvg !== null && (
                <div className="scorecard-overall">
                  Overall: <strong>{scorecardData.overallAvg}/5</strong>
                </div>
              )}
            </div>
          )}
          <form className="scorecard-form" onSubmit={onAddScore}>
            <h4 className="scorecard-form__title">Add score</h4>
            <div className="rec-form__grid">
              <label className="rec-form__label">
                Competency *
                <input
                  className="auth-input"
                  value={competency}
                  onChange={(e) => setCompetency(e.target.value)}
                  placeholder="e.g. Communication, Technical skills"
                  required
                />
              </label>
              <label className="rec-form__label">
                Score (1–5)
                <select className="auth-input" value={score} onChange={(e) => setScore(e.target.value)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label rec-form__label--full">
                Notes
                <input
                  className="auth-input"
                  value={scoreNote}
                  onChange={(e) => setScoreNote(e.target.value)}
                  placeholder="Optional observation…"
                />
              </label>
            </div>
            <button className="btn btn--primary" type="submit" disabled={scoreBusy || !competency.trim()}>
              {scoreBusy ? 'Saving…' : 'Add score'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

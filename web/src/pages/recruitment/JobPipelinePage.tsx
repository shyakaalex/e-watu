import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  createApplication,
  fetchCandidates,
  fetchJobPipeline,
  moveApplicationStage,
  updateJob,
  type Application,
  type ApplicationStage,
  type Candidate,
  type JobStatus,
  type Pipeline,
} from '../../recruitmentApi';

const STAGES: ApplicationStage[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];

const STAGE_LABELS: Record<ApplicationStage, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

const STAGE_CLASS: Record<ApplicationStage, string> = {
  APPLIED: 'pipeline-col--applied',
  SCREENING: 'pipeline-col--screening',
  INTERVIEW: 'pipeline-col--interview',
  OFFER: 'pipeline-col--offer',
  HIRED: 'pipeline-col--hired',
  REJECTED: 'pipeline-col--rejected',
};

const JOB_STATUS_NEXT: Partial<Record<JobStatus, JobStatus>> = {
  DRAFT: 'OPEN',
  OPEN: 'CLOSED',
};

export function JobPipelinePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [data, setData] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setErr(null);
    try {
      setData(await fetchJobPipeline(jobId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const onOpenAddForm = async () => {
    setShowAddForm(true);
    setAddErr(null);
    try {
      setCandidates(await fetchCandidates());
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onAddApplication = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!jobId || !selectedCandidate) return;
    setAddBusy(true);
    setAddErr(null);
    try {
      await createApplication({ jobId, candidateId: selectedCandidate });
      setShowAddForm(false);
      setSelectedCandidate('');
      setCandidateSearch('');
      await load();
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAddBusy(false);
    }
  };

  const onMoveStage = async (app: Application, newStage: ApplicationStage) => {
    setErr(null);
    try {
      await moveApplicationStage(app.id, newStage);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onToggleJobStatus = async () => {
    if (!data) return;
    const next = JOB_STATUS_NEXT[data.job.status];
    if (!next) return;
    try {
      await updateJob(data.job.id, { status: next });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) return <div className="rec-page"><p className="muted">Loading pipeline…</p></div>;
  if (err) return <div className="rec-page"><div className="alert alert--err">{err}</div></div>;
  if (!data) return null;

  const { job, pipeline } = data;
  const totalApps = STAGES.reduce((s, st) => s + (pipeline[st]?.length ?? 0), 0);

  const filteredCandidates = candidates.filter((c) => {
    if (!candidateSearch) return true;
    const q = candidateSearch.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rec-page rec-page--pipeline">
      <div className="rec-page__header">
        <div>
          <div className="rec-page__breadcrumb">
            <Link to="/recruitment/jobs">Jobs</Link> / {job.title}
          </div>
          <h1 className="rec-page__title">{job.title}</h1>
          <div className="rec-job-meta-row">
            {job.department && <span className="muted small">{job.department}</span>}
            {job.location && <span className="muted small">· {job.location}</span>}
            <span className={`badge ${job.status === 'OPEN' ? 'badge--green' : job.status === 'DRAFT' ? 'badge--gray' : 'badge--red'}`}>
              {job.status}
            </span>
            <span className="muted small">{totalApps} applicant{totalApps !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="rec-page__actions">
          {JOB_STATUS_NEXT[job.status] && (
            <button className="btn" onClick={onToggleJobStatus}>
              {job.status === 'DRAFT' ? 'Publish' : 'Close job'}
            </button>
          )}
          <button className="btn btn--primary" onClick={onOpenAddForm}>
            + Add candidate
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showAddForm && (
        <div className="card rec-form-card">
          <h3 className="rec-form-card__title">Add candidate to pipeline</h3>
          {addErr && <div className="alert alert--err">{addErr}</div>}
          <form className="rec-form" onSubmit={onAddApplication}>
            <label className="rec-form__label">
              Search candidates
              <input
                className="auth-input"
                placeholder="Name or email…"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
              />
            </label>
            <label className="rec-form__label">
              Select candidate *
              <select
                className="auth-input"
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                required
                size={Math.min(filteredCandidates.length + 1, 6)}
              >
                <option value="">— choose —</option>
                {filteredCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} · {c.email}
                  </option>
                ))}
              </select>
            </label>
            {filteredCandidates.length === 0 && candidateSearch && (
              <p className="muted small">
                No candidates match. <Link to="/recruitment/candidates">Add one →</Link>
              </p>
            )}
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={addBusy || !selectedCandidate}>
                {addBusy ? 'Adding…' : 'Add to pipeline'}
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => { setShowAddForm(false); setCandidateSearch(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pipeline-board">
        {STAGES.map((stage) => {
          const apps: Application[] = pipeline[stage] ?? [];
          return (
            <div key={stage} className={`pipeline-col ${STAGE_CLASS[stage]}`}>
              <div className="pipeline-col__header">
                <span className="pipeline-col__label">{STAGE_LABELS[stage]}</span>
                <span className="pipeline-col__count">{apps.length}</span>
              </div>
              <div className="pipeline-col__cards">
                {apps.map((app) => (
                  <PipelineCard
                    key={app.id}
                    app={app}
                    currentStage={stage}
                    onMove={onMoveStage}
                  />
                ))}
                {apps.length === 0 && (
                  <div className="pipeline-col__empty">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({
  app,
  currentStage,
  onMove,
}: {
  app: Application;
  currentStage: ApplicationStage;
  onMove: (app: Application, stage: ApplicationStage) => void;
}) {
  const [showMove, setShowMove] = useState(false);
  const otherStages = STAGES.filter((s) => s !== currentStage);

  return (
    <div className="app-card">
      <div className="app-card__name">
        {app.candidate.firstName} {app.candidate.lastName}
      </div>
      <div className="app-card__email muted small">{app.candidate.email}</div>
      {app.candidate.currentTitle && (
        <div className="app-card__title muted small">{app.candidate.currentTitle}</div>
      )}
      {app.interviews && app.interviews.length > 0 && (
        <div className="app-card__interviews small">
          {app.interviews.length} interview{app.interviews.length !== 1 ? 's' : ''}
        </div>
      )}
      <div className="app-card__footer">
        <button
          className="btn btn--ghost app-card__move-btn"
          onClick={() => setShowMove((v) => !v)}
        >
          Move ▾
        </button>
        {showMove && (
          <div className="app-card__move-menu">
            {otherStages.map((s) => (
              <button
                key={s}
                className="app-card__move-option"
                onClick={() => { setShowMove(false); onMove(app, s); }}
              >
                → {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

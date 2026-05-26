import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  createApplication,
  createInterview,
  createOffer,
  fetchApplicationHistory,
  fetchCandidates,
  fetchJobPipeline,
  fetchScorecards,
  jobExportUrl,
  moveApplicationStage,
  bulkMoveStage,
  updateJob,
  type Application,
  type ApplicationStage,
  type Candidate,
  type InterviewType,
  type JobStatus,
  type Pipeline,
  type StageHistory,
} from '../../recruitmentApi';

const STAGES: ApplicationStage[] = [
  'APPLIED',
  'SCREENED',
  'SHORTLISTED',
  'INTERVIEWED',
  'OFFERED',
  'PLACED',
  'REJECTED',
];

const STAGE_LABELS: Record<ApplicationStage, string> = {
  APPLIED: 'Applied',
  SCREENED: 'Screened',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWED: 'Interviewed',
  OFFERED: 'Offered',
  PLACED: 'Placed',
  REJECTED: 'Rejected',
};

const STAGE_CLASS: Record<ApplicationStage, string> = {
  APPLIED: 'pipeline-col--applied',
  SCREENED: 'pipeline-col--screening',
  SHORTLISTED: 'pipeline-col--shortlisted',
  INTERVIEWED: 'pipeline-col--interview',
  OFFERED: 'pipeline-col--offer',
  PLACED: 'pipeline-col--hired',
  REJECTED: 'pipeline-col--rejected',
};

const JOB_STATUS_FLOW: Partial<Record<JobStatus, { next: JobStatus; label: string }>> = {
  DRAFT: { next: 'OPEN', label: 'Publish' },
  OPEN: { next: 'IN_PROGRESS', label: 'Mark In Progress' },
  IN_PROGRESS: { next: 'ON_HOLD', label: 'Put on Hold' },
  ON_HOLD: { next: 'OPEN', label: 'Reopen' },
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

  // Rejection dialog
  const [rejectApp, setRejectApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<ApplicationStage>('SCREENED');
  const [bulkBusy, setBulkBusy] = useState(false);

  // Filter
  const [stageFilter, setStageFilter] = useState<ApplicationStage | ''>('');
  const [searchQ, setSearchQ] = useState('');

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
    if (newStage === 'REJECTED') {
      setRejectApp(app);
      setRejectionReason('');
      return;
    }
    setErr(null);
    try {
      await moveApplicationStage(app.id, newStage);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onConfirmReject = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!rejectApp) return;
    setRejectBusy(true);
    try {
      await moveApplicationStage(rejectApp.id, 'REJECTED', undefined, rejectionReason || undefined);
      setRejectApp(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRejectBusy(false);
    }
  };

  const onToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onBulkMove = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await bulkMoveStage([...selected], bulkStage);
      setSelected(new Set());
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkBusy(false);
    }
  };

  const onToggleJobStatus = async () => {
    if (!data) return;
    const flow = JOB_STATUS_FLOW[data.job.status];
    if (!flow) return;
    try {
      await updateJob(data.job.id, { status: flow.next });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) return <div className="rec-page"><p className="muted">Loading pipeline…</p></div>;
  if (err && !data) return <div className="rec-page"><div className="alert alert--err">{err}</div></div>;
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

  const visibleStages = stageFilter ? [stageFilter] : STAGES;

  return (
    <div className="rec-page rec-page--pipeline">
      <div className="rec-page__header">
        <div>
          <div className="rec-page__breadcrumb">
            <Link to="/recruitment/jobs">Jobs</Link> / {job.title}
          </div>
          <h1 className="rec-page__title">{job.title}</h1>
          <div className="rec-job-meta-row">
            {job.clientName && <span className="muted small">{job.clientName}</span>}
            {job.department && <span className="muted small">· {job.department}</span>}
            {job.location && <span className="muted small">· {job.location}</span>}
            <span className={`badge ${job.status === 'OPEN' || job.status === 'IN_PROGRESS' ? 'badge--green' : job.status === 'DRAFT' ? 'badge--gray' : 'badge--red'}`}>
              {job.status.replace('_', ' ')}
            </span>
            {job.priority !== 'STANDARD' && (
              <span className={`badge ${job.priority === 'EXECUTIVE' ? 'badge--purple' : 'badge--orange'}`}>
                {job.priority}
              </span>
            )}
            <span className="muted small">{totalApps} applicant{totalApps !== 1 ? 's' : ''}</span>
            {job.deadline && (
              <span className="muted small">· Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="rec-page__actions">
          {JOB_STATUS_FLOW[job.status] && (
            <button className="btn" onClick={onToggleJobStatus}>
              {JOB_STATUS_FLOW[job.status]!.label}
            </button>
          )}
          <a
            className="btn btn--ghost"
            href={jobExportUrl(job.id)}
            download={`pipeline-${job.id}.csv`}
          >
            Export CSV
          </a>
          <button className="btn btn--primary" onClick={onOpenAddForm}>
            + Add candidate
          </button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {/* Filters + bulk bar */}
      <div className="pipeline-toolbar">
        <div className="pipeline-toolbar__filters">
          <input
            className="auth-input pipeline-search"
            placeholder="Search by name or email…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <select
            className="auth-input"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as ApplicationStage | '')}
            style={{ width: 'auto' }}
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        {selected.size > 0 && (
          <div className="pipeline-toolbar__bulk">
            <span className="muted small">{selected.size} selected</span>
            <select
              className="auth-input"
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value as ApplicationStage)}
              style={{ width: 'auto' }}
            >
              {STAGES.filter((s) => s !== 'REJECTED').map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
            <button className="btn btn--primary" onClick={onBulkMove} disabled={bulkBusy}>
              {bulkBusy ? 'Moving…' : 'Move all'}
            </button>
            <button className="btn btn--ghost" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        )}
      </div>

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
              <button className="btn btn--ghost" type="button" onClick={() => { setShowAddForm(false); setCandidateSearch(''); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rejection dialog */}
      {rejectApp && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-card__title">Reject candidate</h3>
            <p className="muted small">
              {rejectApp.candidate.firstName} {rejectApp.candidate.lastName} — {rejectApp.job.title}
            </p>
            <form onSubmit={onConfirmReject}>
              <label className="rec-form__label" style={{ marginTop: 12 }}>
                Disqualification reason
                <select
                  className="auth-input"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                >
                  <option value="">— select reason —</option>
                  <option value="Overqualified">Overqualified</option>
                  <option value="Underqualified">Underqualified</option>
                  <option value="Salary mismatch">Salary mismatch</option>
                  <option value="Location mismatch">Location mismatch</option>
                  <option value="Position filled">Position filled</option>
                  <option value="Cultural fit">Cultural fit</option>
                  <option value="Failed assessment">Failed assessment</option>
                  <option value="Withdrew">Candidate withdrew</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <div className="rec-form__actions" style={{ marginTop: 16 }}>
                <button className="btn btn--danger" type="submit" disabled={rejectBusy}>
                  {rejectBusy ? 'Rejecting…' : 'Confirm rejection'}
                </button>
                <button className="btn btn--ghost" type="button" onClick={() => setRejectApp(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pipeline-board">
        {visibleStages.map((stage) => {
          const allApps: Application[] = pipeline[stage] ?? [];
          const apps = allApps.filter((app) => {
            if (!searchQ) return true;
            const q = searchQ.toLowerCase();
            return (
              app.candidate.firstName.toLowerCase().includes(q) ||
              app.candidate.lastName.toLowerCase().includes(q) ||
              app.candidate.email.toLowerCase().includes(q)
            );
          });
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
                    jobId={jobId!}
                    currentStage={stage}
                    selected={selected.has(app.id)}
                    onToggleSelect={onToggleSelect}
                    onMove={onMoveStage}
                    onReload={load}
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
  jobId,
  currentStage,
  selected,
  onToggleSelect,
  onMove,
  onReload,
}: {
  app: Application;
  jobId: string;
  currentStage: ApplicationStage;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onMove: (app: Application, stage: ApplicationStage) => void;
  onReload: () => Promise<void>;
}) {
  const [showMove, setShowMove] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<StageHistory[]>([]);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('VIDEO');
  const [durationMin, setDurationMin] = useState('60');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [interviewerIds, setInterviewerIds] = useState('');
  const [offerSalary, setOfferSalary] = useState('');
  const [offerStart, setOfferStart] = useState('');
  const [offerProbation, setOfferProbation] = useState('90');
  const [scoreData, setScoreData] = useState<Awaited<ReturnType<typeof fetchScorecards>> | null>(null);
  const otherStages = STAGES.filter((s) => s !== currentStage);
  const latestInterview = app.interviews?.[app.interviews.length - 1];

  const openHistory = async () => {
    setHistoryOpen(true);
    try {
      setHistory(await fetchApplicationHistory(app.id));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const submitInterview = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await createInterview({
        applicationId: app.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        type: interviewType,
        durationMin: parseInt(durationMin, 10),
        locationOrLink: locationOrLink || undefined,
        interviewerIds: interviewerIds.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setInterviewOpen(false);
      await onReload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const openScorecards = async () => {
    if (!latestInterview) return;
    setScoreOpen(true);
    try {
      setScoreData(await fetchScorecards(latestInterview.id));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const submitOffer = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await createOffer({
        applicationId: app.id,
        jobId,
        candidateId: app.candidateId,
        salary: parseFloat(offerSalary),
        currency: 'RWF',
        startDate: offerStart || undefined,
        probationDays: parseInt(offerProbation, 10),
      });
      setOfferOpen(false);
      await onReload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`app-card${selected ? ' app-card--selected' : ''}`}>
      <div className="app-card__check">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(app.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="app-card__name">
        {app.candidate.firstName} {app.candidate.lastName}
      </div>
      <div className="app-card__email muted small">{app.candidate.email}</div>
      {app.candidate.currentTitle && (
        <div className="app-card__title muted small">{app.candidate.currentTitle}</div>
      )}
      <div className="app-card__meta muted small">
        {app.source !== 'MANUAL' && <span className="tag">{app.source.replace(/_/g, ' ')}</span>}
      </div>
      {app.interviews && app.interviews.length > 0 && (
        <div className="app-card__interviews small">
          {app.interviews.length} interview{app.interviews.length !== 1 ? 's' : ''}
        </div>
      )}
      {app.rejectionReason && (
        <div className="app-card__rejection muted small">Reason: {app.rejectionReason}</div>
      )}
      <div className="app-card__actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
        <button type="button" className="btn btn--ghost small" title="Stage history" onClick={() => void openHistory()}>
          History
        </button>
        {(currentStage === 'SCREENED' || currentStage === 'SHORTLISTED') && (
          <button type="button" className="btn btn--ghost small" onClick={() => setInterviewOpen(true)}>
            Schedule Interview
          </button>
        )}
        {currentStage === 'INTERVIEWED' && latestInterview && (
          <button type="button" className="btn btn--ghost small" onClick={() => void openScorecards()}>
            Scorecards
          </button>
        )}
        {currentStage === 'OFFERED' && (
          <button type="button" className="btn btn--ghost small" onClick={() => setOfferOpen(true)}>
            Create Offer
          </button>
        )}
      </div>
      {msg && <p className="muted small" style={{ color: 'var(--err)' }}>{msg}</p>}
      <div className="app-card__footer">
        <span className="muted small">{new Date(app.createdAt).toLocaleDateString()}</span>
        <button type="button" className="btn btn--ghost app-card__move-btn" onClick={() => setShowMove((v) => !v)}>
          Move ▾
        </button>
        {showMove && (
          <div className="app-card__move-menu">
            {otherStages.map((s) => (
              <button
                key={s}
                className={`app-card__move-option${s === 'REJECTED' ? ' app-card__move-option--danger' : ''}`}
                onClick={() => { setShowMove(false); onMove(app, s); }}
              >
                → {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {historyOpen && (
        <div className="modal-overlay" onClick={() => setHistoryOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">Stage history</h3>
            <ul className="timeline-list">
              {history.map((h) => (
                <li key={h.id} className="muted small">
                  {h.fromStage ?? '—'} → <strong>{h.toStage}</strong>
                  {' · '}{new Date(h.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--ghost" onClick={() => setHistoryOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {interviewOpen && (
        <div className="modal-overlay" onClick={() => setInterviewOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">Schedule interview</h3>
            <form className="rec-form" onSubmit={submitInterview}>
              <label className="rec-form__label">When<input className="auth-input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></label>
              <label className="rec-form__label">Type<select className="auth-input" value={interviewType} onChange={(e) => setInterviewType(e.target.value as InterviewType)}><option value="VIDEO">Video</option><option value="PHONE">Phone</option><option value="IN_PERSON">In person</option></select></label>
              <label className="rec-form__label">Duration (min)<input className="auth-input" type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} /></label>
              <label className="rec-form__label">Location / link<input className="auth-input" value={locationOrLink} onChange={(e) => setLocationOrLink(e.target.value)} /></label>
              <label className="rec-form__label">Interviewer IDs (comma-separated)<input className="auth-input" value={interviewerIds} onChange={(e) => setInterviewerIds(e.target.value)} /></label>
              <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Schedule'}</button>
            </form>
          </div>
        </div>
      )}

      {scoreOpen && scoreData && (
        <div className="modal-overlay" onClick={() => setScoreOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">Scorecards</h3>
            {Object.entries(scoreData.byCompetency).map(([comp, v]) => (
              <p key={comp} className="small">{comp}: avg {v.avg.toFixed(1)}</p>
            ))}
            <button type="button" className="btn btn--ghost" onClick={() => setScoreOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {offerOpen && (
        <div className="modal-overlay" onClick={() => setOfferOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">Create offer</h3>
            <form className="rec-form" onSubmit={submitOffer}>
              <label className="rec-form__label">Salary (RWF)<input className="auth-input" type="number" value={offerSalary} onChange={(e) => setOfferSalary(e.target.value)} required /></label>
              <label className="rec-form__label">Start date<input className="auth-input" type="date" value={offerStart} onChange={(e) => setOfferStart(e.target.value)} /></label>
              <label className="rec-form__label">Probation (days)<input className="auth-input" type="number" value={offerProbation} onChange={(e) => setOfferProbation(e.target.value)} /></label>
              <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Creating…' : 'Create offer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

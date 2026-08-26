import { useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  fetchKpiPeriods,
  previewTeamKpi,
  submitTeamKpi,
  fetchTeamKpis,
  decideTeamKpi,
  type KpiPeriod,
  type TeamKpiRollup,
  type TeamKpiSubmission,
} from '../../payrollApi';

export function TeamKpisPage() {
  const [me, setMe] = useState<any>(null);
  const [periods, setPeriods] = useState<KpiPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [rollup, setRollup] = useState<TeamKpiRollup | null>(null);
  const [summary, setSummary] = useState('');
  const [submissions, setSubmissions] = useState<TeamKpiSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const isSeniorOfficer = me?.roles?.includes('TENANT_ADMIN') || me?.roles?.includes('HR_MANAGER');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [user, periodList] = await Promise.all([fetchMe(), fetchKpiPeriods()]);
      setMe(user);
      setPeriods(periodList || []);
      const activePeriod = (periodList || []).find((p) => p.status === 'ACTIVE') || periodList?.[0];
      if (activePeriod) setSelectedPeriodId(activePeriod.id);
    } catch (err: any) {
      setError(err.message || 'Failed to load Team KPI workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) loadPeriodData();
  }, [selectedPeriodId]);

  const loadPeriodData = async () => {
    try {
      const [preview, subs] = await Promise.all([
        previewTeamKpi(selectedPeriodId).catch(() => null),
        fetchTeamKpis({ kpiPeriodId: selectedPeriodId }),
      ]);
      setRollup(preview);
      setSubmissions(subs || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    setBusy(true);
    try {
      await submitTeamKpi({ kpiPeriodId: selectedPeriodId, summary: summary || undefined });
      setSummary('');
      await loadPeriodData();
      alert('Team KPI sent to the Managing Team for approval.');
    } catch (err: any) {
      alert(err.message || 'Failed to send Team KPI');
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await decideTeamKpi(id, { status, reviewComment: reviewComments[id] });
      await loadPeriodData();
    } catch (err: any) {
      alert(err.message || 'Failed to record decision');
    }
  };

  if (loading) {
    return (
      <div className="rec-page text-center" style={{ padding: '3rem' }}>
        <div className="spinner">Loading Team KPI workspace...</div>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header" style={{ marginBottom: '2rem' }}>
        <h1 className="rec-page__title">Team KPIs</h1>
        <p className="muted">
          {isSeniorOfficer
            ? 'Review Team KPI summaries arranged and sent up by team leaders across the organisation.'
            : "Arrange your team's KPI summary from your direct reports' approved Personal KPIs, then send it to the Managing Team for approval."}
        </p>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}

      <section className="card mb-6" style={{ padding: '1.5rem' }}>
        <label className="rec-form__label">KPI Period</label>
        <select className="auth-input" value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)}>
          <option value="">Select a KPI period</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.status})
            </option>
          ))}
        </select>
      </section>

      {!isSeniorOfficer && rollup && (
        <section className="card mb-6" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your Team's Rollup</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Team Members</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{rollup.memberCount}</div>
            </div>
            <div>
              <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Approved KPIs</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{rollup.approvedKpiCount}</div>
            </div>
            <div>
              <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Average Progress</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{rollup.avgProgress.toFixed(1)}%</div>
            </div>
          </div>
          <div className="mb-4">
            <label className="rec-form__label">Note to the Managing Team (optional)</label>
            <textarea
              className="auth-input"
              style={{ minHeight: '60px' }}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Context or highlights for this period..."
            />
          </div>
          <button className="btn btn--primary" onClick={handleSend} disabled={busy || !selectedPeriodId}>
            {busy ? 'Sending…' : 'Arrange & Send Team KPI'}
          </button>
        </section>
      )}

      <section className="mb-6">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
          {isSeniorOfficer ? 'Team KPI Submissions' : 'Your Submission History'}
        </h2>
        {submissions.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: '2.5rem' }}>
            No Team KPI submissions for this period yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {submissions.map((s) => (
              <div className="card" key={s.id} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{s.period?.name ?? 'KPI Period'}</div>
                    {s.submittedAt && (
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        Sent {new Date(s.submittedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <span
                    className={`badge ${
                      s.status === 'APPROVED' ? 'badge--active' : s.status === 'REJECTED' ? 'badge--danger' : 'badge--warning'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Team Members</div>
                    <div style={{ fontSize: '1rem' }}>{s.memberCount}</div>
                  </div>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Approved KPIs</div>
                    <div style={{ fontSize: '1rem' }}>{s.approvedKpiCount}</div>
                  </div>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Avg Progress</div>
                    <div style={{ fontSize: '1rem' }}>{Number(s.avgProgress).toFixed(1)}%</div>
                  </div>
                </div>
                {s.summary && (
                  <div className="alert alert--neutral" style={{ padding: '0.8rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    {s.summary}
                  </div>
                )}
                {s.reviewComment && (
                  <div className="alert alert--neutral" style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                    <strong>Managing Team comment:</strong> {s.reviewComment}
                  </div>
                )}
                {isSeniorOfficer && s.status === 'SUBMITTED' && (
                  <div style={{ marginTop: '1rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
                    <div className="mb-3">
                      <label className="rec-form__label">Comment (optional)</label>
                      <input
                        type="text"
                        className="auth-input"
                        value={reviewComments[s.id] || ''}
                        onChange={(e) => setReviewComments({ ...reviewComments, [s.id]: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn btn--success btn--sm" onClick={() => handleDecision(s.id, 'APPROVED')}>
                        Approve
                      </button>
                      <button className="btn btn--danger btn--sm" onClick={() => handleDecision(s.id, 'REJECTED')}>
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

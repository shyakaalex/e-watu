import { useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  fetchKpiPeriods,
  createKpiPeriod,
  fetchKpis,
  createKpi,
  submitKpi,
  updateKpiProgress,
  decideKpi,
  fetchMyEmployee,
  type Kpi,
  type KpiPeriod,
} from '../../payrollApi';

export function PersonalKpisPage() {
  const [me, setMe] = useState<any>(null);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<KpiPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [myKpis, setMyKpis] = useState<Kpi[]>([]);
  const [reviewKpis, setReviewKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showKpiModal, setShowKpiModal] = useState(false);
  const [newKpi, setNewKpi] = useState({
    title: '',
    description: '',
    target: '',
    measurementMethod: '',
    weight: 20,
    deadline: '',
  });

  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ name: '', startDate: '', endDate: '' });

  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const isTenantAdmin = me?.roles?.includes('TENANT_ADMIN');
  const isHrManager = me?.roles?.includes('HR_MANAGER');
  const canManagePeriods = isTenantAdmin || isHrManager;

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const [user, myEmp, periodList] = await Promise.all([fetchMe(), fetchMyEmployee(), fetchKpiPeriods()]);
      setMe(user);
      setMyEmployeeId(myEmp?.id ?? null);
      setPeriods(periodList || []);
      const activePeriod = (periodList || []).find((p) => p.status === 'ACTIVE') || periodList?.[0];
      if (activePeriod) setSelectedPeriodId(activePeriod.id);
    } catch (err: any) {
      setError(err.message || 'Failed to load KPI workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) loadKpis();
  }, [selectedPeriodId]);

  const loadKpis = async () => {
    try {
      const [mine, forReview] = await Promise.all([
        fetchKpis({ kpiPeriodId: selectedPeriodId, employeeId: myEmployeeId ?? undefined }),
        fetchKpis({ kpiPeriodId: selectedPeriodId, status: 'SUBMITTED', forReview: true }),
      ]);
      setMyKpis(mine || []);
      setReviewKpis(forReview || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const period = await createKpiPeriod(newPeriod);
      setShowPeriodModal(false);
      setNewPeriod({ name: '', startDate: '', endDate: '' });
      await loadWorkspace();
      setSelectedPeriodId(period.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create KPI period');
    }
  };

  const handleCreateKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId) {
      alert('Select a KPI period first');
      return;
    }
    try {
      await createKpi({ ...newKpi, kpiPeriodId: selectedPeriodId });
      setShowKpiModal(false);
      setNewKpi({ title: '', description: '', target: '', measurementMethod: '', weight: 20, deadline: '' });
      await loadKpis();
    } catch (err: any) {
      alert(err.message || 'Failed to create KPI');
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitKpi(id);
      await loadKpis();
    } catch (err: any) {
      alert(err.message || 'Failed to submit KPI');
    }
  };

  const handleProgress = async (id: string, progress: number) => {
    try {
      await updateKpiProgress(id, progress);
      await loadKpis();
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    }
  };

  const handleDecision = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await decideKpi(id, { status, managerComment: reviewComments[id] });
      await loadKpis();
    } catch (err: any) {
      alert(err.message || 'Failed to record decision');
    }
  };

  if (loading) {
    return (
      <div className="rec-page text-center" style={{ padding: '3rem' }}>
        <div className="spinner">Loading KPI workspace...</div>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="rec-page__title">Team & Personal KPIs</h1>
          <p className="muted">
            Plan your Personal KPIs and submit them to your team leader for approval. If you lead a
            team, review and approve KPIs submitted by your direct reports below.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {canManagePeriods && (
            <button className="btn btn--secondary" onClick={() => setShowPeriodModal(true)}>
              + KPI Period
            </button>
          )}
          <button className="btn btn--primary" onClick={() => setShowKpiModal(true)} disabled={!selectedPeriodId}>
            + Plan a Personal KPI
          </button>
        </div>
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
        {periods.length === 0 && (
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            No KPI periods yet. {canManagePeriods ? 'Create one to get started.' : 'Ask an admin or HR manager to create one.'}
          </p>
        )}
      </section>

      <section className="mb-6">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>My KPIs</h2>
        {myKpis.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: '2.5rem' }}>
            No personal KPIs planned for this period yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {myKpis.map((k) => (
              <div className="card" key={k.id} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{k.title}</h3>
                    {k.description && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>{k.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge badge--neutral">Weight: {k.weight}%</span>
                    <span
                      className={`badge ${
                        k.status === 'APPROVED' ? 'badge--active' : k.status === 'REJECTED' ? 'badge--danger' : 'badge--warning'
                      }`}
                    >
                      {k.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Target</div>
                    <div style={{ fontSize: '0.9rem' }}>{k.target}</div>
                  </div>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Measurement</div>
                    <div style={{ fontSize: '0.9rem' }}>{k.measurementMethod}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                  <div>
                    <label className="rec-form__label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Progress</span>
                      <strong>{k.progress}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="auth-input"
                      style={{ padding: 0 }}
                      value={Number(k.progress)}
                      onChange={(e) => handleProgress(k.id, parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Deadline</div>
                    <div style={{ fontSize: '0.9rem' }}>{new Date(k.deadline).toLocaleDateString()}</div>
                  </div>
                </div>
                {k.managerComment && (
                  <div className="alert alert--neutral" style={{ marginTop: '1rem', padding: '0.8rem', fontSize: '0.85rem' }}>
                    <strong>Team leader comment:</strong> {k.managerComment}
                  </div>
                )}
                {(k.status === 'DRAFT' || k.status === 'REJECTED') && (
                  <div style={{ marginTop: '1rem' }}>
                    <button className="btn btn--primary btn--sm" onClick={() => handleSubmit(k.id)}>
                      Submit to Team Leader
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>KPIs Awaiting My Approval</h2>
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Personal KPIs submitted by your direct reports.
        </p>
        {reviewKpis.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: '2rem' }}>
            Nothing waiting on your review right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reviewKpis.map((k) => (
              <div className="card" key={k.id} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>{k.title}</h3>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {k.employee ? `${k.employee.firstName} ${k.employee.lastName}` : 'Employee'}
                    </div>
                  </div>
                  <span className="badge badge--neutral">Weight: {k.weight}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Target</div>
                    <div style={{ fontSize: '0.9rem' }}>{k.target}</div>
                  </div>
                  <div>
                    <div className="muted font-semibold" style={{ fontSize: '0.8rem' }}>Measurement</div>
                    <div style={{ fontSize: '0.9rem' }}>{k.measurementMethod}</div>
                  </div>
                </div>
                <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
                  <div className="mb-3">
                    <label className="rec-form__label">Comment (optional)</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Feedback for the employee..."
                      value={reviewComments[k.id] || ''}
                      onChange={(e) => setReviewComments({ ...reviewComments, [k.id]: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn--success btn--sm" onClick={() => handleDecision(k.id, 'APPROVED')}>
                      Approve
                    </button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDecision(k.id, 'REJECTED')}>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showKpiModal && (
        <div className="rec-modal-backdrop">
          <div className="rec-modal" style={{ maxWidth: '550px', padding: '2rem' }}>
            <h3 className="rec-modal__title mb-4">Plan a Personal KPI</h3>
            <form onSubmit={handleCreateKpi}>
              <div className="mb-4">
                <label className="rec-form__label">Title</label>
                <input
                  type="text"
                  className="auth-input"
                  value={newKpi.title}
                  onChange={(e) => setNewKpi({ ...newKpi, title: e.target.value })}
                  placeholder="e.g. Reduce payroll error rate"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="rec-form__label">Description</label>
                <textarea
                  className="auth-input"
                  style={{ minHeight: '60px' }}
                  value={newKpi.description}
                  onChange={(e) => setNewKpi({ ...newKpi, description: e.target.value })}
                  placeholder="Optional background details..."
                />
              </div>
              <div className="mb-4">
                <label className="rec-form__label">Target</label>
                <input
                  type="text"
                  className="auth-input"
                  value={newKpi.target}
                  onChange={(e) => setNewKpi({ ...newKpi, target: e.target.value })}
                  placeholder="e.g. Under 1% correction rate"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="rec-form__label">Measurement Method</label>
                <input
                  type="text"
                  className="auth-input"
                  value={newKpi.measurementMethod}
                  onChange={(e) => setNewKpi({ ...newKpi, measurementMethod: e.target.value })}
                  placeholder="e.g. Monthly payroll audit report"
                  required
                />
              </div>
              <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="rec-form__label">Weight (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="auth-input"
                    value={newKpi.weight}
                    onChange={(e) => setNewKpi({ ...newKpi, weight: parseInt(e.target.value, 10) })}
                    required
                  />
                </div>
                <div>
                  <label className="rec-form__label">Deadline</label>
                  <input
                    type="date"
                    className="auth-input"
                    value={newKpi.deadline}
                    onChange={(e) => setNewKpi({ ...newKpi, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn--neutral" onClick={() => setShowKpiModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPeriodModal && (
        <div className="rec-modal-backdrop">
          <div className="rec-modal" style={{ maxWidth: '450px', padding: '2rem' }}>
            <h3 className="rec-modal__title mb-4">New KPI Period</h3>
            <form onSubmit={handleCreatePeriod}>
              <div className="mb-4">
                <label className="rec-form__label">Name</label>
                <input
                  type="text"
                  className="auth-input"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  placeholder="e.g. Q1 2026"
                  required
                />
              </div>
              <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="rec-form__label">Start Date</label>
                  <input
                    type="date"
                    className="auth-input"
                    value={newPeriod.startDate}
                    onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="rec-form__label">End Date</label>
                  <input
                    type="date"
                    className="auth-input"
                    value={newPeriod.endDate}
                    onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn--neutral" onClick={() => setShowPeriodModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

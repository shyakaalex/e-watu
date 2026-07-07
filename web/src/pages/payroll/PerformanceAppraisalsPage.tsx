import { useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  fetchAppraisals,
  fetchAppraisal,
  submitSelfAssessment,
  submitManagerReview,
  submitHRValidation,
  fetchEmployees,
  fetchFeedbackRequests,
} from '../../payrollApi';

export function PerformanceAppraisalsPage() {
  const [me, setMe] = useState<any>(null);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected appraisal detail
  const [selectedAppraisal, setSelectedAppraisal] = useState<any>(null);
  const [viewDetail, setViewDetail] = useState(false);
  const [feedbackRequests, setFeedbackRequests] = useState<any[]>([]);

  // Self assessment form state
  const [selfComment, setSelfComment] = useState('');
  const [selfGoalRatings, setSelfGoalRatings] = useState<Record<string, number>>({});
  const [selfGoalComments, setSelfGoalComments] = useState<Record<string, string>>({});
  const [selfCompRatings, setSelfCompRatings] = useState<Record<string, number>>({});
  const [selfCompComments, setSelfCompComments] = useState<Record<string, string>>({});

  // Manager review form state
  const [managerComment, setManagerComment] = useState('');
  const [managerAdjustment, setManagerAdjustment] = useState(0);
  const [managerGoalRatings, setManagerGoalRatings] = useState<Record<string, number>>({});
  const [managerGoalComments, setManagerGoalComments] = useState<Record<string, string>>({});
  const [managerCompRatings, setManagerCompRatings] = useState<Record<string, number>>({});
  const [managerCompComments, setManagerCompComments] = useState<Record<string, string>>({});

  // HR Validation form state
  const [hrComment, setHRComment] = useState('');
  const [hrScore, setHRScore] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await fetchMe();
      setMe(user);

      const empList = await fetchEmployees();
      setEmployees(empList);

      const matchedEmp = empList.find((e) => e.email.toLowerCase() === user.email.toLowerCase());

      const list = await fetchAppraisals();
      setAppraisals(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load appraisals');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppraisal = async (id: string) => {
    try {
      setLoading(true);
      const app = await fetchAppraisal(id);
      setSelectedAppraisal(app);
      setViewDetail(true);

      // Prepopulate self assessment states
      setSelfComment(app.selfComment || '');
      const sGoals: Record<string, number> = {};
      const sGoalComments: Record<string, string> = {};
      app.goalRatings?.forEach((gr: any) => {
        if (gr.selfRating) sGoals[gr.goalId] = Number(gr.selfRating);
        if (gr.selfComment) sGoalComments[gr.goalId] = gr.selfComment;
      });
      setSelfGoalRatings(sGoals);
      setSelfGoalComments(sGoalComments);

      const sComps: Record<string, number> = {};
      const sCompComments: Record<string, string> = {};
      app.competencyRatings?.forEach((cr: any) => {
        if (cr.selfRating) sComps[cr.competencyId] = Number(cr.selfRating);
        if (cr.selfComment) sCompComments[cr.competencyId] = cr.selfComment;
      });
      setSelfCompRatings(sComps);
      setSelfCompComments(sCompComments);

      // Prepopulate manager review states
      setManagerComment(app.managerComment || '');
      setManagerAdjustment(Number(app.managerAdjustment || 0));
      const mGoals: Record<string, number> = {};
      const mGoalComments: Record<string, string> = {};
      app.goalRatings?.forEach((gr: any) => {
        if (gr.managerRating) mGoals[gr.goalId] = Number(gr.managerRating);
        if (gr.managerComment) mGoalComments[gr.goalId] = gr.managerComment;
      });
      setManagerGoalRatings(mGoals);
      setManagerGoalComments(mGoalComments);

      const mComps: Record<string, number> = {};
      const mCompComments: Record<string, string> = {};
      app.competencyRatings?.forEach((cr: any) => {
        if (cr.managerRating) mComps[cr.competencyId] = Number(cr.managerRating);
        if (cr.managerComment) mCompComments[cr.competencyId] = cr.managerComment;
      });
      setManagerCompRatings(mComps);
      setManagerCompComments(mCompComments);

      // Prepopulate HR Validation states
      setHRComment(app.hrComment || '');
      setHRScore(Number(app.finalScore || app.managerScore || 3.0));

      // Fetch 360-degree feedback requests for employee
      const fbRequests = await fetchFeedbackRequests(undefined, app.employeeId);
      setFeedbackRequests(fbRequests.filter((r: any) => r.appraisalId === id));
    } catch (err: any) {
      alert(err.message || 'Failed to load appraisal detail');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSelf = async () => {
    try {
      const goalRatingsList = selectedAppraisal.goalRatings.map((gr: any) => ({
        goalId: gr.goalId,
        rating: selfGoalRatings[gr.goalId] || 3,
        comment: selfGoalComments[gr.goalId] || '',
      }));

      const competencyRatingsList = selectedAppraisal.competencyRatings.map((cr: any) => ({
        competencyId: cr.competencyId,
        rating: selfCompRatings[cr.competencyId] || 3,
        comment: selfCompComments[cr.competencyId] || '',
      }));

      await submitSelfAssessment(selectedAppraisal.id, {
        selfComment,
        goalRatings: goalRatingsList,
        competencyRatings: competencyRatingsList,
      });

      alert('Self assessment submitted!');
      setViewDetail(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit self assessment');
    }
  };

  const handleSubmitManager = async () => {
    try {
      const goalRatingsList = selectedAppraisal.goalRatings.map((gr: any) => ({
        goalId: gr.goalId,
        rating: managerGoalRatings[gr.goalId] || 3,
        comment: managerGoalComments[gr.goalId] || '',
      }));

      const competencyRatingsList = selectedAppraisal.competencyRatings.map((cr: any) => ({
        competencyId: cr.competencyId,
        rating: managerCompRatings[cr.competencyId] || 3,
        comment: managerCompComments[cr.competencyId] || '',
      }));

      await submitManagerReview(selectedAppraisal.id, {
        managerComment,
        managerAdjustment,
        goalRatings: goalRatingsList,
        competencyRatings: competencyRatingsList,
      });

      alert('Manager review submitted!');
      setViewDetail(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit manager review');
    }
  };

  const handleSubmitHR = async () => {
    try {
      await submitHRValidation(selectedAppraisal.id, {
        hrComment,
        hrScore,
      });
      alert('HR validation locked and completed!');
      setViewDetail(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit HR validation');
    }
  };

  const isHR = me?.roles?.includes('HR_MANAGER') || me?.roles?.includes('TENANT_ADMIN');
  const matchedMeEmp = employees.find((e) => e.email.toLowerCase() === me?.email?.toLowerCase());
  const isSelf = selectedAppraisal && matchedMeEmp && selectedAppraisal.employeeId === matchedMeEmp.id;
  const isManager = selectedAppraisal && matchedMeEmp && selectedAppraisal.employee?.managerId === matchedMeEmp.id;

  // Aggregate 360-degree feedback responses
  const getAverage360Rating = (competencyId: string) => {
    const responses = feedbackRequests
      .filter((r) => r.status === 'COMPLETED' && r.response)
      .map((r) => r.response);

    if (responses.length === 0) return null;

    let sum = 0;
    let count = 0;

    responses.forEach((resp) => {
      const compRating = resp.competencyRatings?.[competencyId];
      if (compRating) {
        sum += Number(compRating.rating);
        count++;
      }
    });

    return count > 0 ? (sum / count).toFixed(1) : null;
  };

  if (loading && !viewDetail) {
    return (
      <div className="rec-page text-center" style={{ padding: '3rem' }}>
        <div className="spinner">Loading appraisals reviews...</div>
      </div>
    );
  }

  if (viewDetail && selectedAppraisal) {
    return (
      <div className="rec-page">
        <div className="mb-4">
          <button className="btn btn--neutral btn--sm" onClick={() => setViewDetail(false)}>
            ← Back to Appraisals List
          </button>
        </div>

        <div className="rec-page__header mb-6">
          <h1 className="rec-page__title">Review Appraisal Detail</h1>
          <p className="muted">
            Employee: <strong>{selectedAppraisal.employee?.firstName} {selectedAppraisal.employee?.lastName}</strong> ({selectedAppraisal.employee?.jobTitle}) | Cycle: <strong>{selectedAppraisal.cycle?.name}</strong>
          </p>
          <div className="mt-2">
            Status: <span className="badge badge--warning">{selectedAppraisal.status}</span>
          </div>
        </div>

        {/* side by side ratings table */}
        <section className="card mb-6">
          <h3 className="card-title mb-4">Goal & Competency Ratings Workspace</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Performance Item</th>
                  <th>Weight / Description</th>
                  <th>Self Rating (1-5)</th>
                  <th>Manager Rating (1-5)</th>
                  <th>360 Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="font-semibold" style={{ background: '#f5f5f5' }}>Goals & KPIs (60% value)</td>
                </tr>
                {selectedAppraisal.goalRatings?.map((gr: any) => (
                  <tr key={gr.id}>
                    <td>
                      <strong>{gr.goal?.title}</strong>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{gr.goal?.target}</div>
                    </td>
                    <td>{gr.goal?.weight}% weight</td>
                    <td>
                      {selectedAppraisal.status === 'SELF_ASSESSMENT' && isSelf ? (
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="auth-input"
                          style={{ margin: 0, padding: '0.3rem', width: '60px' }}
                          value={selfGoalRatings[gr.goalId] || ''}
                          onChange={(e) => setSelfGoalRatings({ ...selfGoalRatings, [gr.goalId]: parseFloat(e.target.value) })}
                        />
                      ) : (
                        gr.selfRating || 'Pending'
                      )}
                    </td>
                    <td>
                      {selectedAppraisal.status === 'MANAGER_REVIEW' && isManager ? (
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="auth-input"
                          style={{ margin: 0, padding: '0.3rem', width: '60px' }}
                          value={managerGoalRatings[gr.goalId] || ''}
                          onChange={(e) => setManagerGoalRatings({ ...managerGoalRatings, [gr.goalId]: parseFloat(e.target.value) })}
                        />
                      ) : (
                        gr.managerRating || 'Pending'
                      )}
                    </td>
                    <td className="text-muted">N/A (Goals only rated by Self/Manager)</td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={5} className="font-semibold" style={{ background: '#f5f5f5' }}>Competencies & Skills (40% value)</td>
                </tr>
                {selectedAppraisal.competencyRatings?.map((cr: any) => {
                  const rating360 = getAverage360Rating(cr.competencyId);
                  return (
                    <tr key={cr.id}>
                      <td>
                        <strong>{cr.competency?.name}</strong>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>{cr.competency?.description}</td>
                      <td>
                        {selectedAppraisal.status === 'SELF_ASSESSMENT' && isSelf ? (
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className="auth-input"
                            style={{ margin: 0, padding: '0.3rem', width: '60px' }}
                            value={selfCompRatings[cr.competencyId] || ''}
                            onChange={(e) => setSelfCompRatings({ ...selfCompRatings, [cr.competencyId]: parseFloat(e.target.value) })}
                          />
                        ) : (
                          cr.selfRating || 'Pending'
                        )}
                      </td>
                      <td>
                        {selectedAppraisal.status === 'MANAGER_REVIEW' && isManager ? (
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className="auth-input"
                            style={{ margin: 0, padding: '0.3rem', width: '60px' }}
                            value={managerCompRatings[cr.competencyId] || ''}
                            onChange={(e) => setManagerCompRatings({ ...managerCompRatings, [cr.competencyId]: parseFloat(e.target.value) })}
                          />
                        ) : (
                          cr.managerRating || 'Pending'
                        )}
                      </td>
                      <td className="font-semibold" style={{ color: 'var(--primary-color)' }}>
                        {rating360 || 'No peer reviews'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Calculations / Summary View */}
        <section className="card mb-6" style={{ background: '#f9f9f9' }}>
          <h3 className="card-title mb-4">Calculations Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <span className="muted">Self Score Estimate</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{selectedAppraisal.selfScore || 'N/A'}</div>
            </div>
            <div className="card">
              <span className="muted">Manager Score (Raw)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{selectedAppraisal.managerScore || 'N/A'}</div>
            </div>
            <div className="card">
              <span className="muted">Manager Adjustment</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{selectedAppraisal.managerAdjustment || 0}</div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #2e7d32' }}>
              <span className="muted">Final Calculated Score</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2e7d32' }}>{selectedAppraisal.finalScore || 'N/A'}</div>
            </div>
          </div>
        </section>

        {/* Self Assessment Form */}
        {selectedAppraisal.status === 'SELF_ASSESSMENT' && isSelf && (
          <section className="card mb-6">
            <h3 className="card-title mb-4">Complete Self-Assessment</h3>
            <div className="mb-4">
              <label className="rec-form__label">Self Justification / Comments</label>
              <textarea
                className="auth-input"
                style={{ minHeight: '100px' }}
                value={selfComment}
                onChange={(e) => setSelfComment(e.target.value)}
                placeholder="Write your justification for the ratings entered above..."
              />
            </div>
            <button className="btn btn--primary" onClick={handleSubmitSelf}>
              Submit Self Assessment
            </button>
          </section>
        )}

        {/* Manager Review Form */}
        {selectedAppraisal.status === 'MANAGER_REVIEW' && isManager && (
          <section className="card mb-6">
            <h3 className="card-title mb-4">Complete Manager Review</h3>
            <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="rec-form__label">Manager Overall Comments</label>
                <input
                  type="text"
                  className="auth-input"
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  placeholder="Summarize employee's performance during this cycle..."
                />
              </div>
              <div>
                <label className="rec-form__label">Rating Adjustment</label>
                <input
                  type="number"
                  step="0.1"
                  min="-1"
                  max="1"
                  className="auth-input"
                  value={managerAdjustment}
                  onChange={(e) => setManagerAdjustment(parseFloat(e.target.value))}
                />
              </div>
            </div>
            <button className="btn btn--primary" onClick={handleSubmitManager}>
              Submit Review to HR
            </button>
          </section>
        )}

        {/* HR Validation Form */}
        {selectedAppraisal.status === 'HR_REVIEW' && isHR && (
          <section className="card mb-6">
            <h3 className="card-title mb-4">HR Validation & Calibration</h3>
            <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="rec-form__label">HR Calibration Comments</label>
                <input
                  type="text"
                  className="auth-input"
                  value={hrComment}
                  onChange={(e) => setHRComment(e.target.value)}
                  placeholder="Add HR validation/moderation comments..."
                />
              </div>
              <div>
                <label className="rec-form__label">Final Calibrated Score</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  max="5"
                  className="auth-input"
                  value={hrScore}
                  onChange={(e) => setHRScore(parseFloat(e.target.value))}
                />
              </div>
            </div>
            <button className="btn btn--success" onClick={handleSubmitHR}>
              Lock & Validate Appraisal
            </button>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header mb-6">
        <h1 className="rec-page__title">Appraisals & Reviews</h1>
        <p className="muted">Submit self-appraisals, evaluate team competencies, and access finalized performance records.</p>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}

      <section className="card">
        <h2 className="card-title mb-4">Appraisal Review Directory</h2>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Cycle Period</th>
                <th>Self Score</th>
                <th>Manager Score</th>
                <th>Final Score</th>
                <th>Review Stage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appraisals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">No appraisals assigned for this tenant/client.</td>
                </tr>
              ) : (
                appraisals.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.employee?.firstName} {a.employee?.lastName}</strong>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{a.employee?.jobTitle}</div>
                    </td>
                    <td>{a.cycle?.name}</td>
                    <td>{a.selfScore || 'Pending'}</td>
                    <td>{a.managerScore || 'Pending'}</td>
                    <td><strong>{a.finalScore || 'Pending'}</strong></td>
                    <td>
                      <span className="badge badge--warning">{a.status}</span>
                    </td>
                    <td>
                      <button className="btn btn--primary btn--sm" onClick={() => handleSelectAppraisal(a.id)}>
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

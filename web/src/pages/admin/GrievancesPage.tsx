import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  createGrievance,
  fetchMyGrievances,
  fetchAllGrievances,
  fetchTeamGrievances,
  updateGrievance,
  type GrievanceCase,
  type GrievanceCategory,
  type GrievanceStatus,
} from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

const SENIOR_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'MANAGING_DIRECTOR'];

const CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'DISCRIMINATION', label: 'Discrimination' },
  { value: 'WORKPLACE_CONDITIONS', label: 'Workplace Conditions' },
  { value: 'PAY_DISPUTE', label: 'Pay Dispute' },
  { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_BADGE: Record<GrievanceStatus, string> = {
  OPEN: 'badge--orange',
  INVESTIGATING: 'badge--blue',
  RESOLVED: 'badge--green',
  DISMISSED: 'badge--gray',
};

export function GrievancesPage() {
  const [mine, setMine] = useState<GrievanceCase[]>([]);
  const [all, setAll] = useState<GrievanceCase[]>([]);
  const [team, setTeam] = useState<GrievanceCase[]>([]);
  const [isSenior, setIsSenior] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<GrievanceCategory>('OTHER');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const me = await fetchMe();
      const senior = me.roles?.some((r) => SENIOR_ROLES.includes(r)) ?? false;
      setIsSenior(senior);
      const [myCases, allCases, teamCases] = await Promise.all([
        fetchMyGrievances(),
        senior ? fetchAllGrievances() : Promise.resolve([]),
        // Self-scoped server-side to teams the caller leads — empty for anyone who isn't a lead.
        fetchTeamGrievances().catch(() => []),
      ]);
      setMine(myCases);
      setAll(allCases);
      setTeam(teamCases);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    try {
      await createGrievance({ category, description });
      setShowForm(false);
      setCategory('OTHER');
      setDescription('');
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onUpdateStatus = async (id: string, status: GrievanceStatus) => {
    setError(null);
    try {
      const updated = await updateGrievance(id, { status });
      setAll((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onUpdateTeamStatus = async (id: string, status: GrievanceStatus) => {
    setError(null);
    try {
      const updated = await updateGrievance(id, { status });
      setTeam((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  if (loading) {
    return (
      <div className="adm-page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Grievances</h1>
        <p className="adm-page__lead">Raise a concern confidentially, or track its progress with HR.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      <div className="adm-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>My Grievances</h3>
          <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Raise a Grievance'}
          </button>
        </div>

        {showForm && (
          <form className="form" onSubmit={onSubmit} style={{ marginBottom: '1.5rem' }}>
            <label>
              Category
              <select className="auth-input" value={category} onChange={(e) => setCategory(e.target.value as GrievanceCategory)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label>
              Description
              <textarea className="auth-input" style={{ minHeight: '90px' }} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>
            <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>Submit</button>
          </form>
        )}

        {mine.length === 0 ? (
          <p className="muted small">You haven't raised any grievances.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mine.map((c) => (
              <div key={c.id} className="adm-card" style={{ padding: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <strong>{CATEGORIES.find((cat) => cat.value === c.category)?.label ?? c.category}</strong>
                  <span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                </div>
                <p style={{ margin: '0.4rem 0', whiteSpace: 'pre-wrap' }}>{c.description}</p>
                {c.resolutionNotes && (
                  <p className="muted small" style={{ margin: 0 }}>HR response: {c.resolutionNotes}</p>
                )}
                <div className="muted small">Raised {new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {team.length > 0 && (
        <div className="adm-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.25rem' }}>Grievances From My Team</h3>
          <p className="muted small" style={{ marginTop: 0 }}>
            Raised by people on a team you lead. Harassment and Discrimination cases are always
            handled by HR only and never appear here.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Category</th>
                <th>Status</th>
                <th>Raised</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {team.map((c) => (
                <tr key={c.id}>
                  <td>{c.raisedBy ? `${c.raisedBy.firstName} ${c.raisedBy.lastName}` : '—'}</td>
                  <td>{CATEGORIES.find((cat) => cat.value === c.category)?.label ?? c.category}</td>
                  <td><span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                  <td className="muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      className="auth-input"
                      value={c.status}
                      onChange={(e) => onUpdateTeamStatus(c.id, e.target.value as GrievanceStatus)}
                    >
                      <option value="OPEN">Open</option>
                      <option value="INVESTIGATING">Investigating</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="DISMISSED">Dismissed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isSenior && (
        <div className="adm-card">
          <h3 style={{ margin: '0 0 0.75rem' }}>All Grievance Cases</h3>
          {all.length === 0 ? (
            <p className="muted small">No grievance cases on file.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Raised</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {all.map((c) => (
                  <tr key={c.id}>
                    <td>{c.raisedBy ? `${c.raisedBy.firstName} ${c.raisedBy.lastName}` : '—'}</td>
                    <td>{CATEGORIES.find((cat) => cat.value === c.category)?.label ?? c.category}</td>
                    <td><span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                    <td className="muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="auth-input"
                        value={c.status}
                        onChange={(e) => onUpdateStatus(c.id, e.target.value as GrievanceStatus)}
                      >
                        <option value="OPEN">Open</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="DISMISSED">Dismissed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

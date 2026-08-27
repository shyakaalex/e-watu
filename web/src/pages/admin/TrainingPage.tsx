import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  fetchMyTrainingRecords,
  updateMyTrainingRecord,
  fetchTrainingCourses,
  createTrainingCourse,
  deleteTrainingCourse,
  type TrainingRecord,
  type TrainingCourse,
} from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

const SENIOR_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'MANAGING_DIRECTOR'];

const STATUS_BADGE: Record<TrainingRecord['status'], string> = {
  NOT_STARTED: 'badge--gray',
  IN_PROGRESS: 'badge--orange',
  COMPLETED: 'badge--green',
};

export function TrainingPage() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [isSenior, setIsSenior] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, mine, allCourses] = await Promise.all([
        fetchMe(),
        fetchMyTrainingRecords(),
        fetchTrainingCourses().catch(() => []),
      ]);
      setRecords(mine);
      setCourses(allCourses);
      setIsSenior(me.roles?.some((r) => SENIOR_ROLES.includes(r)) ?? false);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onMark = async (recordId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    setError(null);
    try {
      const updated = await updateMyTrainingRecord(recordId, status);
      setRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onCreateCourse = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    try {
      await createTrainingCourse({ name, description: description || undefined, dueDate: dueDate || undefined });
      setShowForm(false);
      setName('');
      setDescription('');
      setDueDate('');
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onDeleteCourse = async (id: string) => {
    if (!confirm('Delete this training course? This removes it for everyone assigned.')) return;
    setError(null);
    try {
      await deleteTrainingCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  if (loading) {
    return (
      <div className="adm-page">
        <p className="muted">Loading trainings…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Training</h1>
        <p className="adm-page__lead">Mandatory trainings assigned to you.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      <div className="adm-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem' }}>My Trainings</h3>
        {records.length === 0 ? (
          <p className="muted small">No trainings assigned yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.course.name}</td>
                  <td className="muted">{r.course.dueDate ? new Date(r.course.dueDate).toLocaleDateString() : '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status.replace('_', ' ')}</span></td>
                  <td>
                    {r.status !== 'COMPLETED' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {r.status === 'NOT_STARTED' && (
                          <button type="button" className="btn btn--ghost small" onClick={() => onMark(r.id, 'IN_PROGRESS')}>Start</button>
                        )}
                        <button type="button" className="btn btn--primary small" onClick={() => onMark(r.id, 'COMPLETED')}>Mark Complete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isSenior && (
        <div className="adm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Manage Courses</h3>
            <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : '+ New Course'}
            </button>
          </div>

          {showForm && (
            <form className="form" onSubmit={onCreateCourse} style={{ marginBottom: '1.5rem' }}>
              <label>
                Name
                <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Description
                <textarea className="auth-input" style={{ minHeight: '70px' }} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label>
                Due date
                <input type="date" className="auth-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
              <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>Create & Assign to All Active Employees</button>
            </form>
          )}

          {courses.length === 0 ? (
            <p className="muted small">No courses created yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mandatory</th>
                  <th>Due</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="muted">{c.mandatory ? 'Yes' : 'No'}</td>
                    <td className="muted">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <button type="button" className="btn btn--ghost small" onClick={() => onDeleteCourse(c.id)}>Delete</button>
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

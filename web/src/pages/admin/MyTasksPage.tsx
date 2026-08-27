import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  fetchMyTasks,
  fetchTasksAssignedByMe,
  createTask,
  updateTaskStatus,
  deleteTask,
  fetchDirectory,
  fetchMyTeams,
  type Task,
  type TaskStatus,
  type DirectoryEntry,
} from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

const STATUS_LABEL: Record<TaskStatus, string> = { PENDING: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_BADGE: Record<TaskStatus, string> = {
  PENDING: 'badge--orange',
  IN_PROGRESS: 'badge--blue',
  DONE: 'badge--green',
};

export function MyTasksPage() {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [assignedByMe, setAssignedByMe] = useState<Task[]>([]);
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, mine, byMe, dir, myTeams] = await Promise.all([
        fetchMe(),
        fetchMyTasks(),
        fetchTasksAssignedByMe().catch(() => []),
        fetchDirectory().catch(() => []),
        fetchMyTeams().catch(() => []),
      ]);
      setMyTasks(mine);
      setAssignedByMe(byMe);
      setDirectory(dir);
      const isSenior = me.roles?.some((r) => ['TENANT_ADMIN', 'HR_MANAGER', 'MANAGING_DIRECTOR'].includes(r)) ?? false;
      const isTeamLead = myTeams.some((t) => t.myRole === 'LEAD');
      setCanAssign(isSenior || isTeamLead);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onAssign = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    try {
      await createTask({ employeeId: assigneeId, title, description: description || undefined, dueDate: dueDate || undefined });
      setShowForm(false);
      setAssigneeId('');
      setTitle('');
      setDescription('');
      setDueDate('');
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onStatusChange = async (id: string, status: TaskStatus) => {
    setError(null);
    try {
      await updateTaskStatus(id, status);
      setMyTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    setError(null);
    try {
      await deleteTask(id);
      setAssignedByMe((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  if (loading) {
    return (
      <div className="adm-page">
        <p className="muted">Loading tasks…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Tasks</h1>
        <p className="adm-page__lead">To-dos assigned to you, and — if you lead a team — tasks you've assigned.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      <section className="adm-card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="adm-card__title">My Tasks</h2>
        {myTasks.length === 0 ? (
          <p className="muted small">Nothing assigned to you right now.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Task</th><th>Due</th><th>Assigned By</th><th>Status</th></tr>
            </thead>
            <tbody>
              {myTasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.title}</strong>
                    {t.description && <div className="muted small">{t.description}</div>}
                  </td>
                  <td className="muted">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="muted">{t.assignedByName}</td>
                  <td>
                    <select
                      className="auth-input"
                      style={{ width: 'auto' }}
                      value={t.status}
                      onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
                    >
                      <option value="PENDING">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {canAssign && (
        <section className="adm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="adm-card__title" style={{ margin: 0 }}>Tasks I've Assigned</h2>
            <button type="button" className="btn btn--primary small" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : '+ Assign Task'}
            </button>
          </div>

          {showForm && (
            <form className="form" onSubmit={onAssign} style={{ marginBottom: '1.5rem' }}>
              <label>
                Assign To
                <select className="auth-input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                  <option value="">Select colleague…</option>
                  {directory.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName} — {d.jobTitle}</option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                Description (optional)
                <textarea className="auth-input" value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label>
                Due Date (optional)
                <input className="auth-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
              <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>Assign Task</button>
            </form>
          )}

          {assignedByMe.length === 0 ? (
            <p className="muted small">You haven't assigned any tasks yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Task</th><th>Assigned To</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {assignedByMe.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td className="muted">{t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span></td>
                    <td>
                      <button type="button" className="btn btn--ghost small" onClick={() => onDelete(t.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

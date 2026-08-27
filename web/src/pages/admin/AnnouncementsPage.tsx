import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  fetchMyTeams,
  type Announcement,
  type MyTeam,
} from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ledTeams, setLedTeams] = useState<MyTeam[]>([]);
  const [isSenior, setIsSenior] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [teamId, setTeamId] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, list, myTeams] = await Promise.all([
        fetchMe(),
        fetchAnnouncements(),
        fetchMyTeams().catch(() => []),
      ]);
      setAnnouncements(list);
      const senior = me.roles?.some((r) => ['TENANT_ADMIN', 'HR_MANAGER', 'MANAGING_DIRECTOR'].includes(r)) ?? false;
      const led = myTeams.filter((t) => t.myRole === 'LEAD');
      setIsSenior(senior);
      setLedTeams(led);
      // Keep the "Audience" select's value in sync with what it visually defaults to — when the
      // caller isn't senior, there's no "Company-wide" option, so the browser auto-selects the
      // first team. Without this, submitting would silently send teamId: undefined instead.
      if (!senior && led.length > 0) setTeamId(led[0].id);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canPost = isSenior || ledTeams.length > 0;

  const onPost = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    try {
      await createAnnouncement({ title, body, teamId: teamId || undefined });
      setShowForm(false);
      setTitle('');
      setBody('');
      setTeamId('');
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    setError(null);
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const canManage = (a: Announcement) => isSenior || (a.teamId && ledTeams.some((t) => t.id === a.teamId));

  if (loading) {
    return (
      <div className="adm-page">
        <p className="muted">Loading announcements…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Announcements</h1>
        <p className="adm-page__lead">Notices from HR, management, and your team leads.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      {canPost && (
        <div className="adm-toolbar" style={{ marginBottom: '1rem' }}>
          <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Post Announcement'}
          </button>
        </div>
      )}

      {showForm && (
        <form className="adm-card form" onSubmit={onPost} style={{ marginBottom: '1.5rem' }}>
          <label>
            Title
            <input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Message
            <textarea className="auth-input" style={{ minHeight: '90px' }} value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>
          <label>
            Audience
            <select className="auth-input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              {isSenior && <option value="">Company-wide</option>}
              {ledTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} (your team)</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>Post</button>
        </form>
      )}

      {announcements.length === 0 ? (
        <div className="adm-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p className="muted">No announcements yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((a) => (
            <div key={a.id} className="adm-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div>
                  <strong>{a.title}</strong>{' '}
                  <span className="badge badge--neutral" style={{ marginLeft: '0.4rem' }}>
                    {a.team?.name ?? 'Company-wide'}
                  </span>
                </div>
                {canManage(a) && (
                  <button type="button" className="btn btn--ghost small" onClick={() => onDelete(a.id)}>Remove</button>
                )}
              </div>
              <p style={{ margin: '0 0 0.5rem', whiteSpace: 'pre-wrap' }}>{a.body}</p>
              <div className="muted small">
                {a.postedByName} · {new Date(a.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

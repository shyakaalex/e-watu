import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  createTenantUser,
  fetchTenantUsers,
  updateTenantUser,
  type UserRow,
} from '../../api';
import { parseError } from './parseError';
import { useAdminContext } from './useAdminContext';

const ROLE_OPTIONS = ['TENANT_ADMIN', 'TENANT_STAFF', 'HR_MANAGER', 'RECRUITER', 'FINANCE_OFFICER'];

export function UsersPage() {
  const { me, isSuper } = useAdminContext();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roles, setRoles] = useState<string[]>(['TENANT_STAFF']);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setUsers(await fetchTenantUsers());
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isSuper) {
    return <Navigate to="/platform" replace />;
  }

  const onCreate = async (ev: FormEvent) => {
    ev.preventDefault();
    setErr(null);
    try {
      await createTenantUser({
        email,
        password,
        displayName: displayName || undefined,
        roles,
      });
      setShowForm(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRoles(['TENANT_STAFF']);
      await load();
    } catch (e) {
      setErr(parseError(e));
    }
  };

  const toggleActive = async (u: UserRow) => {
    if (u.id === me.sub) return;
    setErr(null);
    try {
      await updateTenantUser(u.id, { active: !u.active });
      await load();
    } catch (e) {
      setErr(parseError(e));
    }
  };

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Team members</h1>
        <p className="adm-page__lead">Invite and manage users in your company workspace.</p>
      </header>

      {err && <div className="alert alert--err">{err}</div>}

      <div className="adm-toolbar">
        <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add user'}
        </button>
        <button type="button" className="btn" onClick={() => load()}>
          Refresh
        </button>
      </div>

      {showForm && (
        <form className="adm-card form" onSubmit={onCreate}>
          <h2 className="adm-card__title">New team member</h2>
          <label>
            Email
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Temporary password
            <input
              className="auth-input"
              type="password"
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Display name
            <input className="auth-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <fieldset>
            <legend>Roles</legend>
            {ROLE_OPTIONS.map((r) => (
              <label key={r} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="checkbox"
                  checked={roles.includes(r)}
                  onChange={(e) => {
                    setRoles((prev) =>
                      e.target.checked ? [...prev, r] : prev.filter((x) => x !== r),
                    );
                  }}
                />{' '}
                {r.replace(/_/g, ' ')}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn btn--primary">
            Create user
          </button>
        </form>
      )}

      {loading && <p className="muted">Loading…</p>}

      {!loading && users && (
        <section className="adm-card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Verified</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName ?? '—'}</td>
                  <td>{u.email}</td>
                  <td className="small">{u.roles.join(', ')}</td>
                  <td>{u.emailVerified ? 'Yes' : 'No'}</td>
                  <td>{u.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    {u.id !== me.sub && (
                      <button type="button" className="btn small" onClick={() => toggleActive(u)}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

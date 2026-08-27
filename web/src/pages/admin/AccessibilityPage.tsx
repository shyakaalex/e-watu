import { useCallback, useEffect, useState } from 'react';
import { fetchTenantUsers, updateTenantUser, type UserRow } from '../../api';
import { ROLE_DESCRIPTIONS, ROLE_OPTIONS } from '../../lib/roleDescriptions';
import { useAdminContext } from './useAdminContext';
import { parseError } from './parseError';
import './accessibility.css';

export function AccessibilityPage() {
  const { me } = useAdminContext();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setUsers(await fetchTenantUsers());
    } catch (e) {
      setError(parseError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onToggle = async (user: UserRow, role: string, enabled: boolean) => {
    const key = `${user.id}:${role}`;
    setError(null);
    setSavingKey(key);
    const nextRoles = enabled ? [...user.roles, role] : user.roles.filter((r) => r !== role);
    try {
      const updated = await updateTenantUser(user.id, { roles: nextRoles });
      setUsers((prev) => prev?.map((u) => (u.id === user.id ? updated : u)) ?? null);
    } catch (e) {
      setError(parseError(e));
    } finally {
      setSavingKey(null);
    }
  };

  const displayed = (users ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return u.email.toLowerCase().includes(q) || (u.displayName ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Accessibility</h1>
        <p className="adm-page__lead">
          Grant or revoke access to specific screens for individual staff — e.g. cover for a Finance
          Officer who's on leave by switching on Payroll access for someone else, then switch it off
          when they're back.
        </p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      <div className="adm-toolbar" style={{ marginBottom: '1rem' }}>
        <input
          className="auth-input"
          placeholder="Search staff by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      {loading && <p className="muted">Loading staff…</p>}

      {!loading && displayed.length === 0 && (
        <div className="adm-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p className="muted">No staff match your search.</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayed.map((u) => {
            const isSelf = u.id === me.sub;
            return (
              <div key={u.id} className="adm-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>{u.displayName ?? u.email}</strong>{' '}
                    <span className="muted small">{u.email}</span>
                  </div>
                  {isSelf && <span className="badge badge--gray">Your account</span>}
                  {!u.active && <span className="badge badge--red">Inactive</span>}
                </div>

                {isSelf ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    You can't change your own access here — ask another Company Admin.
                  </p>
                ) : (
                  <div>
                    {ROLE_OPTIONS.map((role) => {
                      const info = ROLE_DESCRIPTIONS[role];
                      const enabled = u.roles.includes(role);
                      const key = `${u.id}:${role}`;
                      const isSaving = savingKey === key;
                      return (
                        <div key={role} className="acc-row">
                          <div className="acc-row__label">
                            <span>{info.label}</span>
                            <span className="muted small">{info.desc}</span>
                          </div>
                          <label className="acc-switch">
                            <input
                              type="checkbox"
                              checked={enabled}
                              disabled={isSaving}
                              onChange={(e) => onToggle(u, role, e.target.checked)}
                            />
                            <span className="acc-switch__track" />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

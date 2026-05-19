import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveTenant,
  createTenant,
  fetchMe,
  fetchMyTenant,
  fetchPendingTenants,
  fetchTenants,
  rejectTenant,
  setAccessToken,
  type TenantRow,
} from '../api';

type Me = {
  sub: string;
  email?: string;
  username?: string;
  roles: string[];
  tenant_id?: string;
};

export function PlatformAdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [myTenant, setMyTenant] = useState<TenantRow | null | undefined>(undefined);
  const [tenants, setTenants] = useState<TenantRow[] | null>(null);
  const [pending, setPending] = useState<TenantRow[] | null>(null);
  const [tab, setTab] = useState<'all' | 'pending'>('pending');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isSuper = me?.roles.includes('PLATFORM_SUPER_ADMIN');

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const profile = await fetchMe();
      setMe(profile);
      if (profile.roles.includes('PLATFORM_SUPER_ADMIN')) {
        const [all, pend] = await Promise.all([fetchTenants(), fetchPendingTenants()]);
        setTenants(all);
        setPending(pend);
        setMyTenant(undefined);
      } else {
        setTenants(null);
        setPending(null);
        const t = profile.tenant_id ? await fetchMyTenant() : null;
        setMyTenant(t);
      }
    } catch (e) {
      setMe(null);
      setTenants(null);
      setPending(null);
      setMyTenant(undefined);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (ev: FormEvent) => {
    ev.preventDefault();
    setErr(null);
    try {
      await createTenant({ name, slug, plan: 'starter', country: 'RW' });
      setName('');
      setSlug('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onApprove = async (id: string) => {
    setErr(null);
    try {
      await approveTenant(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onReject = async (id: string) => {
    setErr(null);
    try {
      await rejectTenant(id, rejectReason || undefined);
      setRejectingId(null);
      setRejectReason('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__title">
          <Link to="/" className="admin__home-link">
            ← Home
          </Link>
          <h1>{isSuper ? 'Platform admin' : 'Your company'}</h1>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setAccessToken(null);
            window.location.href = '/';
          }}
        >
          Log out
        </button>
      </header>

      {loading && <p className="muted">Loading…</p>}

      {me && (
        <section className="card">
          <h2>Signed in</h2>
          <p>
            <strong>{me.username ?? me.email ?? me.sub}</strong>
            {me.email ? ` · ${me.email}` : null}
          </p>
          <p className="muted">Roles: {me.roles.join(', ') || '—'}</p>
        </section>
      )}

      {me && me.tenant_id && (
        <section className="card">
          <h2>Modules</h2>
          <div className="admin__modules">
            <Link to="/recruitment" className="admin__module-card">
              <span className="admin__module-icon">📋</span>
              <div>
                <div className="admin__module-name">Recruitment & ATS</div>
                <div className="admin__module-desc muted small">Jobs, pipeline, candidates, interviews</div>
              </div>
              <span className="admin__module-arrow">→</span>
            </Link>
            <Link to="/talent-pool" className="admin__module-card">
              <span className="admin__module-icon">🗂</span>
              <div>
                <div className="admin__module-name">Talent Pool</div>
                <div className="admin__module-desc muted small">Candidate profiles, pools, search & tagging</div>
              </div>
              <span className="admin__module-arrow">→</span>
            </Link>
          </div>
        </section>
      )}

      {err && (
        <div className="alert alert--err">
          <strong>Error</strong>
          <pre>{err}</pre>
          {!isSuper ? null : (
            <p className="muted small">
              Tenant management requires <code>PLATFORM_SUPER_ADMIN</code> (bootstrap via first user, or company owner
              uses a different screen).
            </p>
          )}
        </div>
      )}

      {isSuper && tenants && pending && (
        <section className="card">
          <div className="row">
            <div className="admin__tabs">
              <button
                type="button"
                className={tab === 'pending' ? 'btn btn--primary' : 'btn'}
                onClick={() => setTab('pending')}
              >
                Pending approvals ({pending.length})
              </button>
              <button
                type="button"
                className={tab === 'all' ? 'btn btn--primary' : 'btn'}
                onClick={() => setTab('all')}
              >
                All tenants ({tenants.length})
              </button>
            </div>
            <button type="button" className="btn" onClick={() => load()}>
              Refresh
            </button>
          </div>

          {tab === 'pending' && (
            <>
              <h3>Pending verification / approval</h3>
              {pending.length === 0 ? (
                <p className="muted">No companies waiting.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Slug / URL</th>
                      <th>Business email</th>
                      <th>Phone</th>
                      <th>Registered</th>
                      <th>Owner email verified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>
                          <code>{t.slug}</code>
                          <div className="muted small">
                            {t.slug}.erp.<em>yourdomain</em>
                          </div>
                        </td>
                        <td>{t.businessEmail ?? '—'}</td>
                        <td>{t.phone ?? '—'}</td>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                        <td>{t.emailVerifiedAt ? 'Yes' : 'No'}</td>
                        <td>
                          <div className="admin__actions">
                            <button type="button" className="btn btn--primary" onClick={() => onApprove(t.id)}>
                              Approve
                            </button>
                            {rejectingId === t.id ? (
                              <span className="admin__reject-inline">
                                <input
                                  className="auth-input"
                                  placeholder="Rejection reason (optional)"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <button type="button" className="btn" onClick={() => onReject(t.id)}>
                                  Confirm reject
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--ghost"
                                  onClick={() => setRejectingId(null)}
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                  setRejectingId(t.id);
                                  setRejectReason('');
                                }}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'all' && (
            <>
              <h3>All tenants</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>
                        <code>{t.slug}</code>
                      </td>
                      <td>{t.status}</td>
                      <td>{t.plan ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3>New tenant (manual, usually ACTIVE)</h3>
              <form className="form" onSubmit={onCreate}>
                <label>
                  Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="ACME HR Ltd"
                  />
                </label>
                <label>
                  Slug
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    required
                    placeholder="acme-hr"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  />
                </label>
                <button type="submit" className="btn btn--primary">
                  Create tenant
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {!isSuper && myTenant !== undefined && (
        <section className="card">
          <h2>Company status</h2>
          {!myTenant ? (
            <p className="muted">No company linked to this account.</p>
          ) : (
            <>
              <p>
                <strong>{myTenant.name}</strong> · <code>{myTenant.slug}</code>
              </p>
              <p>
                Status: <strong>{myTenant.status}</strong>
              </p>
              {myTenant.status === 'PENDING_APPROVAL' && (
                <p className="muted">
                  Your workspace is waiting for platform approval. You can sign in after verifying your email. You
                  will get full access once an administrator approves your company.
                </p>
              )}
              {myTenant.status === 'ACTIVE' && (
                <p className="muted">Your company is active. More tenant-scoped modules will appear here over time.</p>
              )}
              {myTenant.status === 'REJECTED' && (
                <p className="alert alert--err">
                  Registration was not approved.
                  {myTenant.rejectionReason ? ` Reason: ${myTenant.rejectionReason}` : null}
                </p>
              )}
              <p className="muted small">
                Example URL pattern: <code>{myTenant.slug}.erp.yourdomain.com</code> or{' '}
                <code>/company/{myTenant.slug}</code> (routing TBD).
              </p>
            </>
          )}
        </section>
      )}

      {me && !isSuper && myTenant === undefined && !loading && !err && (
        <p className="muted">Could not load company details.</p>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveTenant,
  fetchMyTenant,
  fetchPendingTenants,
  fetchTenants,
  type TenantRow,
} from '../../api';
import { fetchCandidates, fetchInterviews, fetchJobs } from '../../recruitmentApi';
import { hasAnyRole, PAYROLL_ROLES } from '../../lib/roles';
import { StatusBadge } from './StatusBadge';
import { parseError } from './parseError';
import { useAdminContext } from './useAdminContext';

const COMING_MODULES = [
  { icon: '📊', name: 'Performance', desc: 'Goals, appraisals, 360 feedback' },
  { icon: '🛂', name: 'Work permits', desc: 'Immigration case management' },
  { icon: '🤝', name: 'Client CRM', desc: 'Client portal & service requests' },
];

export function AdminOverviewPage() {
  const { me, isSuper } = useAdminContext();
  const [tenants, setTenants] = useState<TenantRow[] | null>(null);
  const [pending, setPending] = useState<TenantRow[] | null>(null);
  const [myTenant, setMyTenant] = useState<TenantRow | null | undefined>(undefined);
  const [recStats, setRecStats] = useState<{ jobs: number; open: number; candidates: number; interviews: number } | null>(
    null,
  );
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      if (isSuper) {
        const [all, pend] = await Promise.all([fetchTenants(), fetchPendingTenants()]);
        setTenants(all);
        setPending(pend);
        setMyTenant(undefined);
        setRecStats(null);
      } else {
        const t = me.tenant_id ? await fetchMyTenant() : null;
        setMyTenant(t);
        setTenants(null);
        setPending(null);
        if (t?.status === 'ACTIVE' && me.tenant_id) {
          try {
            const [jobs, candidates, interviews] = await Promise.all([
              fetchJobs(),
              fetchCandidates(),
              fetchInterviews(),
            ]);
            setRecStats({
              jobs: jobs.length,
              open: jobs.filter((j) => j.status === 'OPEN').length,
              candidates: candidates.length,
              interviews: interviews.length,
            });
          } catch {
            setRecStats(null);
          }
        } else {
          setRecStats(null);
        }
      }
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }, [isSuper, me.tenant_id]);

  useEffect(() => {
    load();
  }, [load]);

  const onQuickApprove = async (id: string) => {
    setApproving(id);
    setErr(null);
    try {
      await approveTenant(id);
      await load();
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setApproving(null);
    }
  };

  const activeCount = tenants?.filter((t) => t.status === 'ACTIVE').length ?? 0;
  const pendingCount = pending?.length ?? 0;

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">{isSuper ? 'Platform overview' : 'Workspace overview'}</h1>
        <p className="adm-page__lead">
          {isSuper
            ? 'Manage subscribed HR companies, approvals, and platform health.'
            : 'Your company dashboard — modules and recruitment at a glance.'}
        </p>
      </header>

      {err && (
        <div className="alert alert--err" role="alert">
          {err}
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}

      {!loading && isSuper && tenants && pending && (
        <>
          <div className="adm-kpis">
            <div className="adm-kpi">
              <div className="adm-kpi__label">Total tenants</div>
              <div className="adm-kpi__value">{tenants.length}</div>
            </div>
            <div className="adm-kpi">
              <div className="adm-kpi__label">Active</div>
              <div className="adm-kpi__value">{activeCount}</div>
            </div>
            <div className="adm-kpi">
              <div className="adm-kpi__label">Pending approval</div>
              <div className="adm-kpi__value">{pendingCount}</div>
              {pendingCount > 0 && (
                <div className="adm-kpi__hint">
                  <Link to="/platform/tenants">Review queue →</Link>
                </div>
              )}
            </div>
            <div className="adm-kpi">
              <div className="adm-kpi__label">Rejected</div>
              <div className="adm-kpi__value">
                {tenants.filter((t) => t.status === 'REJECTED').length}
              </div>
            </div>
          </div>

          {pendingCount > 0 && (
            <section className="adm-card">
              <h2 className="adm-card__title">Needs your attention</h2>
              <div className="adm-pending-list">
                {pending.slice(0, 5).map((t) => (
                  <div key={t.id} className="adm-pending-row">
                    <div>
                      <strong>{t.name}</strong>
                      <div className="muted small">
                        <code>{t.slug}</code>
                        {t.businessEmail ? ` · ${t.businessEmail}` : null}
                        {t.emailVerifiedAt ? ' · email verified' : ' · email not verified'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <StatusBadge status={t.status} />
                      <button
                        type="button"
                        className="btn btn--primary small"
                        disabled={approving === t.id}
                        onClick={() => onQuickApprove(t.id)}
                      >
                        {approving === t.id ? '…' : 'Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {pendingCount > 5 && (
                <p className="muted small" style={{ marginTop: '0.75rem' }}>
                  <Link to="/platform/tenants">View all {pendingCount} pending →</Link>
                </p>
              )}
            </section>
          )}

          <section className="adm-card">
            <h2 className="adm-card__title">Quick links</h2>
            <div className="adm-modules">
              <Link to="/platform/tenants" className="adm-module">
                <span className="adm-module__icon">⌂</span>
                <span className="adm-module__name">Tenant directory</span>
                <span className="adm-module__desc">Approve, reject, or create companies</span>
              </Link>
              <Link to="/platform/system" className="adm-module">
                <span className="adm-module__icon">⚙</span>
                <span className="adm-module__name">System health</span>
                <span className="adm-module__desc">Service status and connectivity</span>
              </Link>
            </div>
          </section>
        </>
      )}

      {!loading && !isSuper && myTenant !== undefined && (
        <>
          <section className="adm-card">
            <h2 className="adm-card__title">Your company</h2>
            {!myTenant ? (
              <p className="muted">No company is linked to this account.</p>
            ) : (
              <>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{myTenant.name}</strong>{' '}
                  <StatusBadge status={myTenant.status} />
                </p>
                <p className="muted small" style={{ margin: 0 }}>
                  Workspace slug: <code>{myTenant.slug}</code>
                  {myTenant.plan ? ` · Plan: ${myTenant.plan}` : null}
                </p>
                {myTenant.status === 'PENDING_APPROVAL' && (
                  <p className="muted" style={{ marginTop: '0.75rem' }}>
                    Your registration is under review. You can use recruitment features once the platform team
                    approves your company.
                  </p>
                )}
                {myTenant.status === 'REJECTED' && (
                  <p className="alert alert--err" style={{ marginTop: '0.75rem' }}>
                    Registration was not approved.
                    {myTenant.rejectionReason ? ` ${myTenant.rejectionReason}` : null}
                  </p>
                )}
              </>
            )}
          </section>

          {recStats && (
            <div className="adm-kpis">
              <div className="adm-kpi">
                <div className="adm-kpi__label">Open jobs</div>
                <div className="adm-kpi__value">{recStats.open}</div>
                <div className="adm-kpi__hint muted">{recStats.jobs} total jobs</div>
              </div>
              <div className="adm-kpi">
                <div className="adm-kpi__label">Candidates</div>
                <div className="adm-kpi__value">{recStats.candidates}</div>
              </div>
              <div className="adm-kpi">
                <div className="adm-kpi__label">Interviews</div>
                <div className="adm-kpi__value">{recStats.interviews}</div>
              </div>
            </div>
          )}

          <section className="adm-card">
            <h2 className="adm-card__title">Modules</h2>
            <div className="adm-modules">
              {myTenant?.status === 'ACTIVE' ? (
                <Link to="/recruitment" className="adm-module">
                  <span className="adm-module__icon">📋</span>
                  <span className="adm-module__name">Recruitment & ATS</span>
                  <span className="adm-module__desc">Jobs, pipeline, candidates, interviews</span>
                  <span className="status-badge status-badge--active adm-module__badge">Active</span>
                </Link>
              ) : (
                <div className="adm-module adm-module--disabled" title="Available when company is approved">
                  <span className="adm-module__icon">📋</span>
                  <span className="adm-module__name">Recruitment & ATS</span>
                  <span className="adm-module__desc">Unlocks after platform approval</span>
                  <span className="status-badge status-badge--pending adm-module__badge">Locked</span>
                </div>
              )}
              {myTenant?.status === 'ACTIVE' && hasAnyRole(me.roles, PAYROLL_ROLES) ? (
                <Link to="/payroll/runs" className="adm-module">
                  <span className="adm-module__icon">💰</span>
                  <span className="adm-module__name">Payroll & HR</span>
                  <span className="adm-module__desc">Runs, payslips, leave, outsourcing</span>
                  <span className="status-badge status-badge--active adm-module__badge">Active</span>
                </Link>
              ) : myTenant?.status === 'ACTIVE' ? (
                <div className="adm-module adm-module--disabled" title="Requires HR or Finance role">
                  <span className="adm-module__icon">💰</span>
                  <span className="adm-module__name">Payroll & HR</span>
                  <span className="adm-module__desc">Runs, payslips, leave, outsourcing</span>
                  <span className="status-badge status-badge--pending adm-module__badge">No access</span>
                </div>
              ) : null}
              {COMING_MODULES.map((m) => (
                <div key={m.name} className="adm-module adm-module--disabled">
                  <span className="adm-module__icon">{m.icon}</span>
                  <span className="adm-module__name">{m.name}</span>
                  <span className="adm-module__desc">{m.desc}</span>
                  <span className="status-badge status-badge--draft adm-module__badge">Coming soon</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { fetchMe } from '../api';
import { hasAnyRole, PAYROLL_ROLES, RECRUITMENT_ROLES, TALENT_POOL_ROLES } from '../lib/roles';
import { clearAuthTokens } from '../auth/token';
import { isAuthFailureStatus } from '../lib/auth-session';
import './admin-layout.css';

export type AdminMe = {
  sub: string;
  email?: string;
  username?: string;
  roles: string[];
  tenant_id?: string;
};

export type AdminOutletContext = {
  me: AdminMe;
  isSuper: boolean;
  reloadMe: () => Promise<void>;
};

export function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setMe(await fetchMe());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = Number(msg.split(':')[0]);
      if (isAuthFailureStatus(status)) {
        clearAuthTokens();
        navigate('/login', { replace: true });
        return;
      }
      setLoadError(
        status === 429
          ? 'Too many profile checks in a short time. Please wait a few seconds, then retry.'
          : 'Could not load your profile. The server may be restarting — try again in a moment.',
      );
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const isSuper = me?.roles.includes('PLATFORM_SUPER_ADMIN') ?? false;
  const showRecruitment = me ? hasAnyRole(me.roles, RECRUITMENT_ROLES) : false;
  const showTalentPool = me ? hasAnyRole(me.roles, TALENT_POOL_ROLES) : false;
  const showPayroll = me ? hasAnyRole(me.roles, PAYROLL_ROLES) : false;
  const displayName = me?.username ?? me?.email ?? 'User';
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onLogout = () => {
    clearAuthTokens();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="adm-boot">
        <p className="muted">Loading workspace…</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="adm-boot">
        {loadError && (
          <div className="alert alert--err" role="alert">
            {loadError}
          </div>
        )}
        <button type="button" className="btn btn--primary" onClick={() => { setLoading(true); load(); }}>
          Retry
        </button>
      </div>
    );
  }

  const outletContext: AdminOutletContext = { me, isSuper, reloadMe: load };

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-sidebar__brand">
          <Link to="/" className="adm-sidebar__home">
            E-Watu
          </Link>
          <div className="adm-sidebar__subtitle">
            {isSuper ? 'Platform control' : 'Company workspace'}
          </div>
        </div>

        <nav className="adm-nav" aria-label="Admin">
          <NavLink
            to="/platform"
            end
            className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
          >
            <span className="adm-nav__icon" aria-hidden>
              ◉
            </span>
            Overview
          </NavLink>

          {isSuper && (
            <>
              <NavLink
                to="/platform/tenants"
                className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
              >
                <span className="adm-nav__icon" aria-hidden>
                  ⌂
                </span>
                Tenants
              </NavLink>
              <NavLink
                to="/platform/system"
                className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
              >
                <span className="adm-nav__icon" aria-hidden>
                  ⚙
                </span>
                System
              </NavLink>
            </>
          )}

          {me.tenant_id && !isSuper && (
            <>
              <NavLink
                to="/platform/settings"
                className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
              >
                <span className="adm-nav__icon" aria-hidden>
                  ⚙
                </span>
                Settings
              </NavLink>
              <NavLink
                to="/platform/users"
                className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
              >
                <span className="adm-nav__icon" aria-hidden>
                  👥
                </span>
                Team
              </NavLink>
              {showRecruitment && (
                <NavLink
                  to="/recruitment"
                  className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                >
                  <span className="adm-nav__icon" aria-hidden>
                    📋
                  </span>
                  Recruitment
                </NavLink>
              )}
              {showPayroll && (
                <>
                  <NavLink
                    to="/payroll"
                    end
                    className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                  >
                    <span className="adm-nav__icon" aria-hidden>
                      💰
                    </span>
                    Payroll Dashboard
                  </NavLink>
                  <NavLink
                    to="/payroll/employees"
                    className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                  >
                    <span className="adm-nav__icon" aria-hidden>
                      👥
                    </span>
                    Payroll Employees
                  </NavLink>
                  <NavLink
                    to="/payroll/periods"
                    className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                  >
                    <span className="adm-nav__icon" aria-hidden>
                      📅
                    </span>
                    Payroll Periods
                  </NavLink>
                </>
              )}
              {me.roles.includes('CLIENT_ADMIN') && (
                <NavLink
                  to="/client-portal/payroll"
                  className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                >
                  <span className="adm-nav__icon" aria-hidden>
                    🧾
                  </span>
                  Payroll Approvals
                </NavLink>
              )}
              {showTalentPool && (
                <>
                  <NavLink
                    to="/talent-pool/pools"
                    className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                  >
                    <span className="adm-nav__icon" aria-hidden>
                      🎯
                    </span>
                    Talent Pools
                  </NavLink>
                  <NavLink
                    to="/talent-pool/profiles"
                    className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                  >
                    <span className="adm-nav__icon" aria-hidden>
                      👤
                    </span>
                    Pool Profiles
                  </NavLink>
                  <NavLink
                    to="/talent-pool/searches"
                    className={({ isActive }) => `adm-nav__link${isActive ? ' adm-nav__link--active' : ''}`}
                  >
                    <span className="adm-nav__icon" aria-hidden>
                      🔍
                    </span>
                    Saved Searches
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        <div className="adm-sidebar__foot">
          <div className="adm-user">
            <span className="adm-user__avatar" aria-hidden>
              {initials}
            </span>
            <div className="adm-user__meta">
              <div className="adm-user__name">{displayName}</div>
              <div className="adm-user__role muted small">
                {me.roles[0]?.replace(/_/g, ' ') ?? 'User'}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn--ghost adm-sidebar__logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}

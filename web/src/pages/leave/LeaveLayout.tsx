import { useEffect, useState, type CSSProperties } from 'react';
import { NavLink, Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { fetchMe } from '../../api';
import '../payroll/payroll-layout.css';

export function LeaveLayout() {
  const [roles, setRoles] = useState<string[]>([]);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchMe()
      .then((me) => setRoles(me.roles))
      .catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  const isHR =
    roles.length === 0 ||
    roles.includes('HR_MANAGER') ||
    roles.includes('TENANT_ADMIN') ||
    roles.includes('PLATFORM_SUPER_ADMIN');

  const isManagementRoute =
    location.pathname.startsWith('/leave/approvals') ||
    location.pathname.startsWith('/leave/balances') ||
    location.pathname.startsWith('/leave/types');

  const sectionLabelStyle: CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255, 255, 255, 0.45)',
    padding: '0.9rem 0.85rem 0.2rem',
  };

  const [activeView, setActiveView] = useState<'employee' | 'management'>(
    isManagementRoute ? 'management' : 'employee',
  );

  useEffect(() => {
    if (isManagementRoute) {
      setActiveView('management');
    } else if (location.pathname === '/leave') {
      setActiveView('employee');
    }
  }, [location.pathname]);

  if (!isHR && isManagementRoute) {
    return <Navigate to="/leave" replace />;
  }

  return (
    <div className={`payroll-shell${navOpen ? ' payroll-shell--nav-open' : ''}`}>
      <div
        className="payroll-nav-backdrop"
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />

      <header className="payroll-topbar">
        <button
          type="button"
          className="payroll-topbar__menu"
          aria-label="Open leave menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          ☰
        </button>
        <span className="payroll-topbar__title">Leave Management</span>
        <Link to="/platform" className="payroll-topbar__back">
          Dashboard
        </Link>
      </header>

      <aside className="payroll-sidebar">
        <Link to="/platform" className="payroll-sidebar__back">
          ← Dashboard
        </Link>
        <div style={{ padding: '0 0.85rem 1rem' }}>
          <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Leave Management
          </div>
        </div>

        <nav className="payroll-nav" aria-label="Leave Management">
          {activeView === 'employee' ? (
            <>
              <div style={sectionLabelStyle}>Menu</div>
              <NavLink
                to="/leave"
                end
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">📊</span>
                Dashboard
              </NavLink>

              <div style={sectionLabelStyle}>My Leave</div>
              <NavLink
                to="/leave/apply"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">➕</span>
                Apply Leave
              </NavLink>
              <NavLink
                to="/leave/requests"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">📋</span>
                Leave Requests
              </NavLink>
              <NavLink
                to="/leave/balance"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">📈</span>
                Leave Balance
              </NavLink>
              <NavLink
                to="/leave/calendar"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">🗓️</span>
                Leave Calendar
              </NavLink>

              <div style={sectionLabelStyle}>Resources</div>
              <NavLink
                to="/leave/policy"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">📘</span>
                Leave Policy
              </NavLink>
              <NavLink
                to="/leave/holidays"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">🎉</span>
                Public Holidays
              </NavLink>
              <NavLink
                to="/leave/documents"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">📁</span>
                Documents
              </NavLink>
              <NavLink
                to="/leave/notifications"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">🔔</span>
                Notifications
              </NavLink>

              <div style={sectionLabelStyle}>Other</div>
              <NavLink
                to="/leave/settings"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">⚙️</span>
                Settings
              </NavLink>
              <NavLink
                to="/leave/help"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">❓</span>
                Help & Support
              </NavLink>
            </>
          ) : (
            <>
              <div style={sectionLabelStyle}>HR Management Dashboard</div>
              <NavLink
                to="/leave/approvals"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">✅</span>
                Pending Approvals
              </NavLink>
              <NavLink
                to="/leave/balances"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">👥</span>
                Employee Balances
              </NavLink>
              <NavLink
                to="/leave/types"
                className={({ isActive }) =>
                  `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
                }
              >
                <span className="payroll-nav__icon">⚙️</span>
                Leave Types & Policies
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="payroll-main">
        <Outlet />
      </main>
    </div>
  );
}

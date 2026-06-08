import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { fetchMe } from '../../api';
import { hasAnyRole, PAYROLL_ROLES } from '../../lib/roles';

export function PayrollLayout() {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchMe()
      .then((me) => setRoles(me.roles))
      .catch(() => setRoles([]));
  }, []);

  const allowed = hasAnyRole(roles, PAYROLL_ROLES) || roles.length === 0;

  if (!allowed && roles.length > 0) {
    return (
      <div className="rec-page">
        <p className="muted">You do not have access to payroll.</p>
        <Link to="/platform">← Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="rec-shell">
      <aside className="rec-sidebar">
        <div className="rec-sidebar__brand">
          <Link to="/platform" className="rec-sidebar__back">← Dashboard</Link>
          <div className="rec-sidebar__title">Payroll</div>
        </div>
        <nav className="rec-nav">
          <NavLink to="/payroll" end className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">🏠</span>
            Dashboard
          </NavLink>

          <div className="rec-nav__section">Payroll</div>
          <NavLink to="/payroll/periods" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">📅</span>
            Periods
          </NavLink>
          <NavLink to="/payroll/runs" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">▶️</span>
            Runs
          </NavLink>
          <NavLink to="/payroll/approvals" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">✅</span>
            Approvals
          </NavLink>

          <div className="rec-nav__section">Workforce</div>
          <NavLink to="/payroll/employees" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">👥</span>
            Employees
          </NavLink>
          <NavLink to="/payroll/leave" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">🌴</span>
            Leave
          </NavLink>

          <div className="rec-nav__section">Outsourcing</div>
          <NavLink to="/payroll/outsourcing" end className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">🏢</span>
            Registry
          </NavLink>
          <NavLink to="/payroll/outsourcing/contracts" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">📋</span>
            Contracts
          </NavLink>

          <div className="rec-nav__section">Finance</div>
          <NavLink to="/payroll/reports" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">📊</span>
            Reports
          </NavLink>
          <NavLink to="/payroll/billing" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">💳</span>
            Billing
          </NavLink>

          <div className="rec-nav__section">Settings</div>
          <NavLink to="/payroll/config" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">⚙️</span>
            Configuration
          </NavLink>
        </nav>
      </aside>
      <main className="rec-main">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import '../payroll/payroll-layout.css';

export function PerformanceLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

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
          aria-label="Open performance menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          ☰
        </button>
        <span className="payroll-topbar__title">Performance</span>
        <Link to="/platform" className="payroll-topbar__back">
          Dashboard
        </Link>
      </header>

      <aside className="payroll-sidebar">
        <Link to="/platform" className="payroll-sidebar__back">
          ← Dashboard
        </Link>
        <div style={{ padding: '0 0.85rem 1rem' }}>
          <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700 }}>
            Performance Management
          </div>
        </div>
        <nav className="payroll-nav" aria-label="Performance Management">
          <NavLink
            to="/performance/cycles"
            className={({ isActive }) =>
              `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
            }
          >
            <span className="payroll-nav__icon">🔄</span>
            Performance Cycles
          </NavLink>
          <NavLink
            to="/performance/goals"
            className={({ isActive }) =>
              `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
            }
          >
            <span className="payroll-nav__icon">🎯</span>
            Goal Setting & KPIs
          </NavLink>
          <NavLink
            to="/performance/appraisals"
            className={({ isActive }) =>
              `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
            }
          >
            <span className="payroll-nav__icon">📝</span>
            Appraisals & Reviews
          </NavLink>
          <NavLink
            to="/performance/360-feedback"
            className={({ isActive }) =>
              `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
            }
          >
            <span className="payroll-nav__icon">👥</span>
            360 Feedback
          </NavLink>
          <NavLink
            to="/performance/pips"
            className={({ isActive }) =>
              `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
            }
          >
            <span className="payroll-nav__icon">📈</span>
            Improvement Plans
          </NavLink>
        </nav>
      </aside>
      <main className="payroll-main">
        <Outlet />
      </main>
    </div>
  );
}

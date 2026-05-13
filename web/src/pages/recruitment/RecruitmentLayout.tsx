import { NavLink, Outlet, Link } from 'react-router-dom';

export function RecruitmentLayout() {
  return (
    <div className="rec-shell">
      <aside className="rec-sidebar">
        <div className="rec-sidebar__brand">
          <Link to="/platform" className="rec-sidebar__back">← Dashboard</Link>
          <div className="rec-sidebar__title">Recruitment</div>
        </div>
        <nav className="rec-nav">
          <NavLink
            to="/recruitment/jobs"
            className={({ isActive }) =>
              `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`
            }
          >
            <span className="rec-nav__icon">📋</span>
            Jobs
          </NavLink>
          <NavLink
            to="/recruitment/candidates"
            className={({ isActive }) =>
              `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`
            }
          >
            <span className="rec-nav__icon">👥</span>
            Candidates
          </NavLink>
          <NavLink
            to="/recruitment/interviews"
            className={({ isActive }) =>
              `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`
            }
          >
            <span className="rec-nav__icon">🗓</span>
            Interviews
          </NavLink>
        </nav>
      </aside>
      <main className="rec-main">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { fetchMe } from '../../api';
import { hasAnyRole, PLACEMENTS_ROLES, RECRUITMENT_ROLES } from '../../lib/roles';

export function RecruitmentLayout() {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchMe()
      .then((me) => setRoles(me.roles))
      .catch(() => setRoles([]));
  }, []);

  const showRecruitment = hasAnyRole(roles, RECRUITMENT_ROLES) || roles.length === 0;
  const showPlacements = hasAnyRole(roles, PLACEMENTS_ROLES) || roles.length === 0;

  if (!showRecruitment && roles.length > 0) {
    return (
      <div className="rec-page">
        <p className="muted">You do not have access to recruitment.</p>
        <Link to="/platform">← Dashboard</Link>
      </div>
    );
  }

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
          <NavLink
            to="/recruitment/offers"
            className={({ isActive }) =>
              `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`
            }
          >
            <span className="rec-nav__icon">📄</span>
            Offers
          </NavLink>
          {showPlacements && (
            <NavLink
              to="/recruitment/placements"
              className={({ isActive }) =>
                `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`
              }
            >
              <span className="rec-nav__icon">✅</span>
              Placements
            </NavLink>
          )}
        </nav>
      </aside>
      <main className="rec-main">
        <Outlet />
      </main>
    </div>
  );
}

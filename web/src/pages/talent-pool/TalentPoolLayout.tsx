import { NavLink, Outlet, Link } from 'react-router-dom';

export function TalentPoolLayout() {
  return (
    <div className="rec-shell">
      <aside className="rec-sidebar">
        <div className="rec-sidebar__brand">
          <Link to="/platform" className="rec-sidebar__back">← Dashboard</Link>
          <div className="rec-sidebar__title">Talent Pool</div>
        </div>
        <nav className="rec-nav">
          <NavLink to="/talent-pool/pools" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">🗂</span>Pools
          </NavLink>
          <NavLink to="/talent-pool/profiles" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">👤</span>Profiles
          </NavLink>
          <NavLink to="/talent-pool/searches" className={({ isActive }) => `rec-nav__link${isActive ? ' rec-nav__link--active' : ''}`}>
            <span className="rec-nav__icon">🔍</span>Saved searches
          </NavLink>
        </nav>
      </aside>
      <main className="rec-main">
        <Outlet />
      </main>
    </div>
  );
}

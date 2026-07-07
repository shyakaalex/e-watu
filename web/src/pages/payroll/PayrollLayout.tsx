import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { fetchMe } from '../../api';
import { hasAnyRole, PAYROLL_ROLES } from '../../lib/roles';
import './payroll-layout.css';

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const IcoApprovals = () => (
  <svg {...iconProps}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IcoClients = () => (
  <svg {...iconProps}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IcoUserPlus = () => (
  <svg {...iconProps}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const IcoUpload = () => (
  <svg {...iconProps}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IcoCalculator = () => (
  <svg {...iconProps}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="8" y2="10.01" />
    <line x1="12" y1="10" x2="12" y2="10.01" />
    <line x1="16" y1="10" x2="16" y2="10.01" />
    <line x1="8" y1="14" x2="8" y2="14.01" />
    <line x1="12" y1="14" x2="12" y2="14.01" />
    <line x1="16" y1="14" x2="16" y2="14.01" />
    <line x1="8" y1="18" x2="8" y2="18.01" />
    <line x1="12" y1="18" x2="16" y2="18" />
  </svg>
);

const IcoLayers = () => (
  <svg {...iconProps}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IcoContract = () => (
  <svg {...iconProps}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M12 18v-6" />
    <path d="M9 15h6" />
  </svg>
);

const IcoPencil = () => (
  <svg {...iconProps}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IcoReport = () => (
  <svg {...iconProps}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
    <line x1="8" y1="9" x2="10" y2="9" />
  </svg>
);

const IcoMail = () => (
  <svg {...iconProps}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IcoMailCheck = () => (
  <svg {...iconProps}>
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    <path d="m16 19 2 2 4-4" />
  </svg>
);

const IcoBell = () => (
  <svg {...iconProps}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IcoSettings = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IcoMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IcoCalendar = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IcoCheckSquare = () => (
  <svg {...iconProps}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const IcoUserCheck = () => (
  <svg {...iconProps}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const IcoUsers = () => (
  <svg {...iconProps}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/payroll/approvals', label: 'Approvals', icon: <IcoApprovals /> },
  { to: '/payroll/clients', label: 'Clients', icon: <IcoClients /> },
  { to: '/payroll/employees/new', label: 'Employee Form', icon: <IcoUserPlus /> },
  { to: '/payroll/bulk-upload', label: 'Bulk Upload', icon: <IcoUpload /> },
  { to: '/payroll/consultants-upload', label: 'Consultants Upload', icon: <IcoUserPlus /> },
  { to: '/payroll/runs', label: 'Payroll Run', icon: <IcoCalculator /> },
  { to: '/payroll/periods', label: 'Payroll Periods', icon: <IcoLayers /> },
  { to: '/payroll/contracts', label: 'Contracts', icon: <IcoContract /> },
  { to: '/payroll/contract-templates', label: 'Contract Templates', icon: <IcoPencil /> },
  { to: '/payroll/leave', label: 'Leave Management', icon: <IcoCalendar /> },
  { to: '/payroll/performance/cycles', label: 'Performance Cycles', icon: <IcoLayers /> },
  { to: '/payroll/performance/goals', label: 'Goal Setting & KPIs', icon: <IcoCheckSquare /> },
  { to: '/payroll/performance/appraisals', label: 'Appraisals & Reviews', icon: <IcoUserCheck /> },
  { to: '/payroll/performance/360-feedback', label: '360 Feedback', icon: <IcoUsers /> },
  { to: '/payroll/reports', label: 'Reports', icon: <IcoReport /> },
  { to: '/payroll/email-settings', label: 'Email Settings', icon: <IcoMail /> },
  { to: '/payroll/email-templates', label: 'Email Templates', icon: <IcoMailCheck /> },
  { to: '/payroll/notifications', label: 'Notifications', icon: <IcoBell /> },
  { to: '/payroll/settings', label: 'Settings', icon: <IcoSettings /> },
];

function PayrollNavItem({ to, label, icon, end, onNavigate }: NavItem & { onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `payroll-nav__link${isActive ? ' payroll-nav__link--active' : ''}`
      }
    >
      <span className="payroll-nav__icon">{icon}</span>
      {label}
    </NavLink>
  );
}

export function PayrollLayout() {
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

  const allowed = hasAnyRole(roles, PAYROLL_ROLES) || roles.length === 0;
  const currentPage = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Payroll';

  if (!allowed && roles.length > 0) {
    return (
      <div className="rec-page">
        <p className="muted">You do not have access to payroll.</p>
        <Link to="/platform">← Dashboard</Link>
      </div>
    );
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
          aria-label="Open payroll menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          <IcoMenu />
        </button>
        <span className="payroll-topbar__title">{currentPage}</span>
        <Link to="/platform" className="payroll-topbar__back">
          Dashboard
        </Link>
      </header>

      <aside className="payroll-sidebar">
        <Link to="/platform" className="payroll-sidebar__back">
          ← Dashboard
        </Link>
        <nav className="payroll-nav" aria-label="Payroll">
          {NAV_ITEMS.map((item) => (
            <PayrollNavItem key={item.to} {...item} onNavigate={() => setNavOpen(false)} />
          ))}
        </nav>
      </aside>

      <main className="payroll-main">
        <Outlet />
      </main>
    </div>
  );
}

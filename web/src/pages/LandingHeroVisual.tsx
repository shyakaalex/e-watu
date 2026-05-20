import { useLayoutEffect, useRef } from 'react';

const CARD_IDS = ['fc-new', 'fc-avrow', 'fc-leave', 'fc-profile', 'fc-payroll', 'fc-checkin', 'fc-perf'] as const;

function drawConnectors(stage: HTMLElement, svg: SVGSVGElement, dash: HTMLElement) {
  const stageRect = stage.getBoundingClientRect();
  const dashRect = dash.getBoundingClientRect();

  const center = (id: string) => {
    const rect = document.getElementById(id)?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: rect.left + rect.width / 2 - stageRect.left,
      y: rect.top + rect.height / 2 - stageRect.top,
    };
  };

  const nearestEdge = (point: { x: number; y: number }) => {
    const left = dashRect.left - stageRect.left;
    const right = dashRect.right - stageRect.left;
    const top = dashRect.top - stageRect.top;
    const bottom = dashRect.bottom - stageRect.top;
    const cx = Math.max(left, Math.min(right, point.x));
    const cy = Math.max(top, Math.min(bottom, point.y));
    const candidates = [
      { x: cx, y: top, d: Math.abs(point.y - top) },
      { x: cx, y: bottom, d: Math.abs(point.y - bottom) },
      { x: left, y: cy, d: Math.abs(point.x - left) },
      { x: right, y: cy, d: Math.abs(point.x - right) },
    ];
    return candidates.reduce((best, next) => (next.d < best.d ? next : best));
  };

  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
  };

  svg.replaceChildren();

  const circleX = (dashRect.left + dashRect.right) / 2 - stageRect.left;
  const circleY = (dashRect.top + dashRect.bottom) / 2 - stageRect.top;
  add('circle', {
    cx: String(circleX),
    cy: String(circleY),
    r: String(Math.max(dashRect.width, dashRect.height) * 0.65),
    fill: 'none',
    stroke: '#C7D2FE',
    'stroke-width': '1',
    'stroke-dasharray': '4 6',
    opacity: '0.3',
  });

  CARD_IDS.forEach((id) => {
    const from = center(id);
    if (!from) return;
    const to = nearestEdge(from);
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    add('path', {
      d: `M${from.x} ${from.y} Q${midX} ${midY} ${to.x} ${to.y}`,
      fill: 'none',
      stroke: '#A5B4FC',
      'stroke-width': '1.5',
      'stroke-dasharray': '4 3',
      opacity: '0.8',
    });
    add('circle', { cx: String(from.x), cy: String(from.y), r: '3', fill: '#818CF8', opacity: '0.9' });
    add('circle', { cx: String(to.x), cy: String(to.y), r: '2.5', fill: '#C7D2FE', opacity: '0.9' });
  });
}

export function LandingHeroVisual() {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    const dash = dashRef.current;
    if (!stage || !svg || !dash) return undefined;

    const render = () => drawConnectors(stage, svg, dash);
    const timeout = window.setTimeout(render, 150);
    window.addEventListener('resize', render);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('resize', render);
    };
  }, []);

  return (
    <div className="landing-hero__stage" ref={stageRef} aria-hidden>
      <div className="landing-hero__canvas">
      <svg className="landing-hero__connector" ref={svgRef} />

      <div className="landing-hero__float landing-hero__float--new" id="fc-new">
        <div
          className="landing-hero__float-face"
          style={{ background: 'linear-gradient(135deg,#FDA4AF,#F43F5E)' }}
        >
          👩
        </div>
        <div>
          <div className="landing-hero__float-title">New employee</div>
          <div className="landing-hero__float-body">
            Ananya Singh joined as
            <br />
            UI/UX designer
          </div>
          <div className="landing-hero__float-time">2m ago</div>
        </div>
      </div>

      <div className="landing-hero__float landing-hero__float--avrow" id="fc-avrow">
        <div className="landing-hero__avrow-imgs">
          <span className="landing-hero__avrow-avatar" style={{ background: 'linear-gradient(135deg,#F87171,#F43F5E)' }}>
            👩
          </span>
          <span className="landing-hero__avrow-avatar" style={{ background: 'linear-gradient(135deg,#60A5FA,#6366F1)' }}>
            👨
          </span>
          <span className="landing-hero__avrow-avatar" style={{ background: 'linear-gradient(135deg,#34D399,#059669)' }}>
            👩
          </span>
          <span className="landing-hero__avrow-avatar" style={{ background: 'linear-gradient(135deg,#FBBF24,#F59E0B)' }}>
            👨
          </span>
        </div>
        <span className="landing-hero__avrow-plus" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </span>
        <span className="landing-hero__avrow-label">12 team members</span>
      </div>

      <div className="landing-hero__float landing-hero__float--leave" id="fc-leave">
        <div className="landing-hero__float-check">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        <div>
          <div className="landing-hero__float-title">Leave approved</div>
          <div className="landing-hero__float-body">
            Riya Sharma&apos;s leave request
            <br />
            has been approved.
          </div>
          <div className="landing-hero__float-time">1m ago</div>
        </div>
      </div>

      <div className="landing-hero__float landing-hero__float--profile" id="fc-profile">
        <div className="landing-hero__profile-avatar">👨</div>
        <div className="landing-hero__profile-name">Arjun Patel</div>
        <div className="landing-hero__profile-role">Product manager</div>
        <div className="landing-hero__profile-badge">
          <span className="landing-hero__profile-dot" />
          Active
        </div>
        <div className="landing-hero__profile-icons">
          <span className="landing-hero__profile-icon" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </span>
          <span className="landing-hero__profile-icon" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="landing-hero__dash" id="dash-window" ref={dashRef}>
        <div className="landing-hero__dash-bar">
          <div className="landing-hero__dash-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="landing-hero__dash-search">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            Search employees
          </div>
          <div className="landing-hero__dash-user">
            <div className="landing-hero__dash-user-face">👨</div>
            <div>
              <div className="landing-hero__dash-user-name">Niyonsenga Eric</div>
              <div className="landing-hero__dash-user-role">HR manager</div>
            </div>
          </div>
        </div>

        <div className="landing-hero__dash-body">
          <div className="landing-hero__dash-sidebar">
            <div className="landing-hero__dash-brand">
              <div className="landing-hero__dash-brand-icon">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <div>
                <div className="landing-hero__dash-brand-name">E-Watu</div>
                <div className="landing-hero__dash-brand-sub">HR operations platform</div>
              </div>
            </div>
            <div className="landing-hero__dash-nav">
              <div className="landing-hero__dash-nav-item landing-hero__dash-nav-item--active">Dashboard</div>
              <div className="landing-hero__dash-nav-item">Employees</div>
              <div className="landing-hero__dash-nav-item">Attendance</div>
              <div className="landing-hero__dash-nav-item">Leave management</div>
              <div className="landing-hero__dash-nav-item">Payroll</div>
              <div className="landing-hero__dash-nav-item">Performance</div>
              <div className="landing-hero__dash-nav-item">Recruitment</div>
              <div className="landing-hero__dash-nav-item">Reports</div>
              <div className="landing-hero__dash-nav-item">Settings</div>
            </div>
            <div className="landing-hero__dash-alert">
              <div className="landing-hero__dash-alert-title">Payroll processed</div>
              <div className="landing-hero__dash-alert-body">Payroll for June 2026 processed.</div>
            </div>
          </div>

          <div className="landing-hero__dash-main">
            <div>
              <div className="landing-hero__dash-greet">Welcome back, Eric! 👋</div>
              <div className="landing-hero__dash-sub">Here is what is happening in your organization today.</div>
            </div>

            <div className="landing-hero__dash-kpis">
              <div className="landing-hero__dash-kpi">
                <div className="landing-hero__dash-kpi-label">Pending review</div>
                <div className="landing-hero__dash-kpi-value">3</div>
                <div className="landing-hero__dash-kpi-note">Awaiting approval</div>
              </div>
              <div className="landing-hero__dash-kpi">
                <div className="landing-hero__dash-kpi-label">Active tenants</div>
                <div className="landing-hero__dash-kpi-value">12</div>
                <div className="landing-hero__dash-kpi-note">Live workspaces</div>
              </div>
              <div className="landing-hero__dash-kpi">
                <div className="landing-hero__dash-kpi-label">Verified admins</div>
                <div className="landing-hero__dash-kpi-value">9</div>
                <div className="landing-hero__dash-kpi-note">Email confirmed</div>
              </div>
              <div className="landing-hero__dash-kpi">
                <div className="landing-hero__dash-kpi-label">Upload slots</div>
                <div className="landing-hero__dash-kpi-value">24</div>
                <div className="landing-hero__dash-kpi-note">Secure presigns</div>
              </div>
            </div>

            <div className="landing-hero__dash-cards">
              <div className="landing-hero__dash-card">
                <div className="landing-hero__dash-card-title">Onboarding queue</div>
                <div className="landing-hero__dash-row">
                  <span>Acme HR</span>
                  <span className="landing-hero__dash-pill landing-hero__dash-pill--pending">Pending</span>
                </div>
                <div className="landing-hero__dash-row">
                  <span>Northwind People</span>
                  <span className="landing-hero__dash-pill landing-hero__dash-pill--ok">Verified</span>
                </div>
              </div>
              <div className="landing-hero__dash-card">
                <div className="landing-hero__dash-card-title">Recent approvals</div>
                <div className="landing-hero__dash-row">
                  <span>BluePeak HR</span>
                  <span className="landing-hero__dash-pill landing-hero__dash-pill--ok">Active</span>
                </div>
                <div className="landing-hero__dash-row">
                  <span>Summit Talent</span>
                  <span className="landing-hero__dash-pill landing-hero__dash-pill--ok">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero__dash-footer">
          <span>© 2026 E-Watu HR operations platform</span>
          <span>Preview dashboard</span>
        </div>
      </div>

      <div className="landing-hero__float landing-hero__float--payroll" id="fc-payroll">
        <div className="landing-hero__float-icon landing-hero__float-icon--orange">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
        </div>
        <div>
          <div className="landing-hero__float-title">Payroll processed</div>
          <div className="landing-hero__float-body">May payroll for 1,248 employees.</div>
          <div className="landing-hero__float-time">5m ago</div>
        </div>
      </div>

      <div className="landing-hero__float landing-hero__float--checkin" id="fc-checkin">
        <div className="landing-hero__float-icon landing-hero__float-icon--brand">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
        <div>
          <div className="landing-hero__float-title">3 employees</div>
          <div className="landing-hero__float-body">checked in in the last 10 mins</div>
        </div>
      </div>

      <div className="landing-hero__float landing-hero__float--perf" id="fc-perf">
        <div className="landing-hero__float-icon landing-hero__float-icon--orange">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>
        <div>
          <div className="landing-hero__float-title">Performance review</div>
          <div className="landing-hero__float-body">Quarterly review cycle is now active.</div>
          <div className="landing-hero__float-time">3m ago</div>
        </div>
      </div>
      </div>
    </div>
  );
}

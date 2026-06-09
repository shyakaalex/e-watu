const modules = [
  { label: 'Recruitment', value: '24 open roles', trend: '+3 this week' },
  { label: 'Payroll', value: 'RWF 48.2M', trend: 'June run ready' },
  { label: 'Compliance', value: '100%', trend: 'PAYE · RSSB · CBHI' },
];

const pipeline = [
  { name: 'Senior Accountant', stage: 'Interview', count: 4 },
  { name: 'HR Officer', stage: 'Offer', count: 2 },
  { name: 'Field Supervisor', stage: 'Applied', count: 11 },
];

export function LandingHeroVisual() {
  return (
    <div className="erp-preview" aria-hidden>
      <div className="erp-preview__glow" />
      <div className="erp-preview__window">
        <div className="erp-preview__chrome">
          <div className="erp-preview__dots">
            <span />
            <span />
            <span />
          </div>
          <div className="erp-preview__url">app.ewatu.com/dashboard</div>
        </div>

        <div className="erp-preview__body">
          <aside className="erp-preview__sidebar">
            <div className="erp-preview__brand">
              <span className="erp-preview__brand-mark">E</span>
              <span>E-Watu</span>
            </div>
            <nav className="erp-preview__nav">
              <span className="erp-preview__nav-item erp-preview__nav-item--active">Overview</span>
              <span className="erp-preview__nav-item">Recruitment</span>
              <span className="erp-preview__nav-item">Payroll</span>
              <span className="erp-preview__nav-item">Employees</span>
              <span className="erp-preview__nav-item">Documents</span>
            </nav>
          </aside>

          <div className="erp-preview__main">
            <header className="erp-preview__header">
              <div>
                <h3 className="erp-preview__title">Workforce overview</h3>
                <p className="erp-preview__subtitle">Rwanda · Q2 2026</p>
              </div>
              <span className="erp-preview__badge">Live</span>
            </header>

            <div className="erp-preview__kpis">
              {modules.map((m) => (
                <div key={m.label} className="erp-preview__kpi">
                  <span className="erp-preview__kpi-label">{m.label}</span>
                  <strong className="erp-preview__kpi-value">{m.value}</strong>
                  <span className="erp-preview__kpi-trend">{m.trend}</span>
                </div>
              ))}
            </div>

            <div className="erp-preview__panel">
              <div className="erp-preview__panel-head">
                <span>Hiring pipeline</span>
                <span className="erp-preview__panel-meta">3 active jobs</span>
              </div>
              <ul className="erp-preview__list">
                {pipeline.map((row) => (
                  <li key={row.name}>
                    <span className="erp-preview__list-name">{row.name}</span>
                    <span className="erp-preview__list-stage">{row.stage}</span>
                    <span className="erp-preview__list-count">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="erp-preview__chips">
        <span className="erp-preview__chip erp-preview__chip--green">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" />
          </svg>
          Payroll approved
        </span>
        <span className="erp-preview__chip erp-preview__chip--blue">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 1l1.5 3.1 3.5.5-2.5 2.4.6 3.5L8 9l-3.1 1.5.6-3.5L3 4.6l3.5-.5z" />
          </svg>
          2 offers pending
        </span>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { PublicNav } from '../components/PublicNav';
import { LandingHeroVisual } from './LandingHeroVisual';
import './landing-hero.css';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: 'blue',
    title: 'Recruitment & ATS',
    desc: 'Post jobs, track candidates, schedule interviews, extend offers and onboard — all in one workflow.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    color: 'green',
    title: 'Payroll & Compliance',
    desc: 'Automated PAYE, RSSB, CBHI and RAMA calculations. Generate payslips and bank files instantly.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    color: 'purple',
    title: 'Document Management',
    desc: 'Securely store contracts, IDs and certificates. Generate signed documents with one click.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    color: 'orange',
    title: 'Talent Pool',
    desc: 'Build curated talent pools from past applicants. Instantly surface the right candidate when a role opens.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    color: 'teal',
    title: 'Smart Notifications',
    desc: 'Automated email and in-app alerts for approvals, contract expiries, interview reminders and more.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    color: 'indigo',
    title: 'Multi-Tenant Platform',
    desc: 'Manage multiple client companies from one admin console. Full data isolation and role-based access.',
  },
];

const solutions = [
  {
    tag: 'HR Teams',
    color: 'blue',
    title: 'Everything your HR team needs in one place',
    points: [
      'End-to-end recruitment pipeline',
      'Onboarding & contract management',
      'Leave tracking & approvals',
      'Employee records & org chart',
    ],
    cta: 'Explore for HR',
  },
  {
    tag: 'Finance & Payroll',
    color: 'green',
    title: 'Payroll that’s accurate and compliant by default',
    points: [
      'Rwanda statutory deductions (PAYE, RSSB, CBHI)',
      'Automated payslip generation',
      'Multi-level approval workflow',
      'Bank payment file export',
    ],
    cta: 'Explore for Finance',
  },
  {
    tag: 'Executive & Clients',
    color: 'purple',
    title: 'Real-time visibility into your workforce',
    points: [
      'Headcount and cost dashboards',
      'Payroll approval portal',
      'Outsourced staff management',
      'Audit trail and compliance reports',
    ],
    cta: 'Explore for Leaders',
  },
];

const resources = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    color: 'blue',
    label: 'Documentation',
    title: 'Platform Guides',
    desc: 'Step-by-step guides for every module — from setting up your first payroll run to managing multi-client contracts.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    color: 'green',
    label: 'HR Playbooks',
    title: 'Best Practice Templates',
    desc: 'Downloadable offer letter templates, interview scorecards, onboarding checklists and HR policy samples.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    color: 'orange',
    label: 'Compliance Hub',
    title: 'Rwanda Labour & Tax Guide',
    desc: 'Up-to-date summaries of RRA PAYE bands, RSSB contribution rates, CBHI rules and labour law requirements.',
  },
];

export function LandingPage() {
  return (
    <div className="landing landing--showcase">
      <PublicNav variant="light" />

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <div className="landing-hero__badge">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 1l1.5 3.1 3.5.5-2.5 2.4.6 3.5L8 9l-3.1 1.5.6-3.5L3 4.6l3.5-.5z" />
            </svg>
            All-in-One HR Solution
          </div>
          <h1 className="landing-hero__title">
            Empower Your
            <br />
            Workforce.
            <br />
            <span className="landing-hero__title-accent">Simplify HR.</span>
          </h1>
          <p className="landing-hero__desc">
            From hiring to payroll and performance tracking, manage your entire HR process in one intuitive platform.
          </p>
          <div className="landing-hero__ctas">
            <Link to="/register-company" className="landing-hero__btn landing-hero__btn--primary">
              Get started <span aria-hidden>→</span>
            </Link>
            <a href="#about" className="landing-hero__btn landing-hero__btn--ghost">
              Book a demo <span aria-hidden>📅</span>
            </a>
          </div>
          <div className="landing-hero__stats">
            <div className="landing-hero__stat">
              <div className="landing-hero__stat-icon landing-hero__stat-icon--blue">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <div className="landing-hero__stat-num">500+</div>
              <div className="landing-hero__stat-label">Active companies</div>
            </div>
            <div className="landing-hero__stat-sep" />
            <div className="landing-hero__stat">
              <div className="landing-hero__stat-icon landing-hero__stat-icon--green">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <div className="landing-hero__stat-num">25K+</div>
              <div className="landing-hero__stat-label">Happy employees</div>
            </div>
            <div className="landing-hero__stat-sep" />
            <div className="landing-hero__stat">
              <div className="landing-hero__stat-icon landing-hero__stat-icon--orange">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </div>
              <div className="landing-hero__stat-num">99.9%</div>
              <div className="landing-hero__stat-label">Data security</div>
            </div>
          </div>
          <div className="landing-hero__trust">
            <div className="landing-hero__trust-avatars" aria-hidden>
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#F87171,#FB923C)' }}>👨</span>
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#60A5FA,#818CF8)' }}>👩</span>
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#34D399,#059669)' }}>👨</span>
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#FBBF24,#F59E0B)' }}>👩</span>
              <span className="landing-hero__trust-avatar" style={{ background: '#0f4775' }}>+</span>
            </div>
            Trusted by HR teams across industries
          </div>
        </div>
        <LandingHeroVisual />
      </section>

      {/* ── Features ── */}
      <section id="features" className="ls-section ls-section--alt">
        <div className="ls-container">
          <div className="ls-section-header">
            <span className="ls-eyebrow">Features</span>
            <h2 className="ls-section-title">Everything you need to run HR at scale</h2>
            <p className="ls-section-sub">One platform covering the full employee lifecycle — from first application to final payslip.</p>
          </div>
          <div className="ls-features-grid">
            {features.map((f) => (
              <div key={f.title} className={`ls-feature-card ls-feature-card--${f.color}`}>
                <div className="ls-feature-card__icon">{f.icon}</div>
                <h3 className="ls-feature-card__title">{f.title}</h3>
                <p className="ls-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solutions ── */}
      <section id="solutions" className="ls-section">
        <div className="ls-container">
          <div className="ls-section-header">
            <span className="ls-eyebrow">Solutions</span>
            <h2 className="ls-section-title">Built for every team in your organisation</h2>
            <p className="ls-section-sub">Whether you run HR, finance or executive oversight — E-Watu gives your team the tools they actually need.</p>
          </div>
          <div className="ls-solutions-grid">
            {solutions.map((s) => (
              <div key={s.tag} className={`ls-solution-card ls-solution-card--${s.color}`}>
                <span className="ls-solution-card__tag">{s.tag}</span>
                <h3 className="ls-solution-card__title">{s.title}</h3>
                <ul className="ls-solution-card__list">
                  {s.points.map((p) => (
                    <li key={p}>
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                        <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <a href="#about" className="ls-solution-card__cta">{s.cta} →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="ls-section ls-section--alt">
        <div className="ls-container">
          <div className="ls-section-header">
            <span className="ls-eyebrow">Pricing</span>
            <h2 className="ls-section-title">Pricing tailored to your organisation</h2>
            <p className="ls-section-sub">We build a plan around your headcount, modules and support needs. No hidden fees.</p>
          </div>
          <div className="ls-pricing-card">
            <div className="ls-pricing-card__left">
              <div className="ls-pricing-card__badge">Custom pricing</div>
              <h3 className="ls-pricing-card__title">Talk to us and we'll build the right plan for you</h3>
              <ul className="ls-pricing-card__perks">
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" /></svg>
                  Recruitment, payroll & document modules
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" /></svg>
                  Rwanda statutory compliance included
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" /></svg>
                  Dedicated onboarding & support
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" /></svg>
                  Multi-tenant or single-company deployment
                </li>
              </ul>
            </div>
            <div className="ls-pricing-card__right">
              <p className="ls-pricing-card__cta-label">Ready to see it in action?</p>
              <a href="#about" className="ls-btn ls-btn--primary ls-btn--lg">Book a free demo</a>
              <a href="/register-company" className="ls-btn ls-btn--ghost">Start free trial</a>
              <p className="ls-pricing-card__note">No credit card required. Setup in under 10 minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Resources ── */}
      <section id="resources" className="ls-section">
        <div className="ls-container">
          <div className="ls-section-header">
            <span className="ls-eyebrow">Resources</span>
            <h2 className="ls-section-title">Everything you need to get up and running</h2>
            <p className="ls-section-sub">Guides, templates and compliance references built specifically for African HR teams.</p>
          </div>
          <div className="ls-resources-grid">
            {resources.map((r) => (
              <div key={r.title} className={`ls-resource-card ls-resource-card--${r.color}`}>
                <div className="ls-resource-card__icon">{r.icon}</div>
                <span className="ls-resource-card__label">{r.label}</span>
                <h3 className="ls-resource-card__title">{r.title}</h3>
                <p className="ls-resource-card__desc">{r.desc}</p>
                <a href="#about" className="ls-resource-card__link">Learn more →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Contact ── */}
      <section id="about" className="ls-section ls-section--dark">
        <div className="ls-container">
          <div className="ls-about-grid">
            <div className="ls-about-copy">
              <span className="ls-eyebrow ls-eyebrow--light">About E-Watu</span>
              <h2 className="ls-section-title ls-section-title--light">
                HR software built for Africa, by people who understand Africa
              </h2>
              <p className="ls-about-desc">
                E-Watu was built to solve the real challenges faced by HR and finance teams across Rwanda and East Africa — from complex statutory deductions to managing outsourced workforces across multiple client sites.
              </p>
              <p className="ls-about-desc">
                Our platform is compliant with RRA, RSSB, CBHI and Rwanda Labour Law out of the box — so your team can focus on people, not paperwork.
              </p>
              <div className="ls-about-stats">
                <div className="ls-about-stat">
                  <div className="ls-about-stat__num">500+</div>
                  <div className="ls-about-stat__label">Companies served</div>
                </div>
                <div className="ls-about-stat">
                  <div className="ls-about-stat__num">25K+</div>
                  <div className="ls-about-stat__label">Employees managed</div>
                </div>
                <div className="ls-about-stat">
                  <div className="ls-about-stat__num">100%</div>
                  <div className="ls-about-stat__label">Rwanda compliant</div>
                </div>
              </div>
            </div>
            <div className="ls-contact-card">
              <h3 className="ls-contact-card__title">Book a demo</h3>
              <p className="ls-contact-card__sub">See E-Watu in action with a live walkthrough tailored to your organisation.</p>
              <form className="ls-contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="ls-contact-form__row">
                  <label>
                    <span>Full name</span>
                    <input type="text" placeholder="Jane Uwera" />
                  </label>
                  <label>
                    <span>Work email</span>
                    <input type="email" placeholder="jane@company.rw" />
                  </label>
                </div>
                <label>
                  <span>Company name</span>
                  <input type="text" placeholder="Acme Ltd" />
                </label>
                <label>
                  <span>Team size</span>
                  <select>
                    <option value="">Select...</option>
                    <option>1–20 employees</option>
                    <option>21–100 employees</option>
                    <option>101–500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </label>
                <button type="submit" className="ls-btn ls-btn--primary ls-btn--full">
                  Request a demo →
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="ls-footer">
        <div className="ls-container ls-footer__inner">
          <div className="ls-footer__brand">
            <span className="ls-footer__logo">E-Watu</span>
            <span className="ls-footer__tagline">HR operations platform for Africa</span>
          </div>
          <nav className="ls-footer__links" aria-label="Footer">
            <a href="#features">Features</a>
            <a href="#solutions">Solutions</a>
            <a href="#pricing">Pricing</a>
            <a href="#resources">Resources</a>
            <a href="#about">About</a>
            <Link to="/login">Log in</Link>
          </nav>
          <p className="ls-footer__copy">© {new Date().getFullYear()} E-Watu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

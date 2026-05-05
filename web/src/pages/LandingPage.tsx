import { Link } from 'react-router-dom';
import { PublicNav } from '../components/PublicNav';

const features = [
  {
    icon: 'layers',
    title: 'One platform, many HR firms',
    body: 'Each client organization is a tenant with its own data boundary—ready for white-label and regional rollout.',
  },
  {
    icon: 'shield',
    title: 'Enterprise-grade access',
    body: 'Email and password with modern hashing, short-lived sessions, and a path to two-factor auth without rework.',
  },
  {
    icon: 'flow',
    title: 'Governed onboarding',
    body: 'Companies apply, verify email, and await approval—so you stay in control of who enters the platform.',
  },
  {
    icon: 'folder',
    title: 'Documents & files',
    body: 'Secure object storage and presigned uploads keep contracts and employee files where you decide.',
  },
];

const journey = [
  {
    title: 'Register your company',
    body: 'Share legal name, business email, phone, and country. Create the administrator who will own the workspace.',
  },
  {
    title: 'Verify your email',
    body: 'We confirm the administrator inbox before sign-in—reducing risk and keeping audit trails clean.',
  },
  {
    title: 'Pending approval',
    body: 'Your tenant is created in a review state. The platform team sees application details in one queue.',
  },
  {
    title: 'Go live',
    body: 'Once approved, status becomes active. Administrators sign in and tenant-scoped modules can roll out over time.',
  },
];

function FeatureIcon({ name }: { name: string }) {
  return <span className={`landing__feature-icon landing__feature-icon--${name}`} aria-hidden />;
}

export function LandingPage() {
  return (
    <div className="landing">
      <PublicNav />

      <header className="landing__hero">
        <div className="landing__hero-inner">
          <p className="landing__eyebrow">Multi-tenant HR operations</p>
          <h1 className="landing__headline">
            The control plane for HR firms you <span className="landing__accent">host &amp; scale</span>
          </h1>
          <p className="landing__sub">
            E-Watu is built for B2B: company onboarding with approval, verified administrators, and a foundation for
            leave, payroll, documents, and more—without compromising how you operate the platform.
          </p>
          <div className="landing__cta-row">
            <Link to="/register-company" className="btn btn--xl btn--primary btn--shine">
              Apply for workspace
            </Link>
            <Link to="/login" className="btn btn--xl btn--outline-light">
              Sign in
            </Link>
          </div>
          <ul className="landing__trust" aria-label="Highlights">
            <li>Multi-tenant by design</li>
            <li>Approval workflow</li>
            <li>Email verification</li>
          </ul>
        </div>
        <div className="landing__hero-visual" aria-hidden>
          <div className="landing__glass-panel">
            <div className="landing__dashboard-cap">Tenant overview</div>
            <div className="landing__mock-row landing__mock-row--head" />
            <div className="landing__mock-row" />
            <div className="landing__mock-row" />
            <div className="landing__stat-row">
              <span className="landing__stat-pill">Pending review</span>
              <span className="landing__stat-pill landing__stat-pill--ok">Active</span>
            </div>
            <div className="landing__mock-row landing__mock-row--short" />
          </div>
        </div>
      </header>

      <section className="landing__section" id="features">
        <p className="landing__section-kicker">Why teams choose E-Watu</p>
        <h2 className="landing__section-title">Built for how you sell HR software</h2>
        <p className="landing__section-lead">
          This preview highlights the spine of the product: identity, tenant lifecycle, and secure delivery. Additional
          HR modules connect to the same core.
        </p>
        <ul className="landing__feature-grid">
          {features.map((f) => (
            <li key={f.title} className="landing__feature-card">
              <FeatureIcon name={f.icon} />
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing__section landing__section--alt" id="how">
        <p className="landing__section-kicker">How onboarding works</p>
        <h2 className="landing__section-title">From application to approved tenant</h2>
        <p className="landing__section-lead">
          The following reflects the live product flow—what your client stakeholders will experience end to end.
        </p>
        <ol className="landing__journey">
          {journey.map((step, i) => (
            <li key={step.title} className="landing__journey-step">
              <span className="landing__journey-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing__cta-band">
        <h2>See the experience firsthand</h2>
        <p>Walk through company registration, verification, and the operator console in a single guided session.</p>
        <div className="landing__cta-row landing__cta-row--center">
          <Link to="/register-company" className="btn btn--xl btn--primary btn--shine">
            Start company application
          </Link>
          <Link to="/login" className="btn btn--xl btn--outline-light">
            I already have access
          </Link>
        </div>
      </section>

      <footer className="landing__footer">
        <div className="landing__footer-left">
          <span className="landing__footer-brand">E-Watu</span>
          <span className="landing__footer-tag">HR operations platform</span>
        </div>
        <span className="landing__footer-muted">Presentation preview · confidential</span>
      </footer>
    </div>
  );
}

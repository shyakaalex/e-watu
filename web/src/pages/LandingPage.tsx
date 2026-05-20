import { Link } from 'react-router-dom';
import { PublicNav } from '../components/PublicNav';
import { LandingHeroVisual } from './LandingHeroVisual';
import './landing-hero.css';

export function LandingPage() {
  return (
    <div className="landing landing--showcase">
      <PublicNav variant="light" />

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
            <a href="#contact" className="landing-hero__btn landing-hero__btn--ghost">
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
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#F87171,#FB923C)' }}>
                👨
              </span>
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#60A5FA,#818CF8)' }}>
                👩
              </span>
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#34D399,#059669)' }}>
                👨
              </span>
              <span className="landing-hero__trust-avatar" style={{ background: 'linear-gradient(135deg,#FBBF24,#F59E0B)' }}>
                👩
              </span>
              <span className="landing-hero__trust-avatar" style={{ background: '#6366F1' }}>
                +
              </span>
            </div>
            Trusted by HR teams across industries
          </div>
        </div>

        <LandingHeroVisual />
      </section>
    </div>
  );
}

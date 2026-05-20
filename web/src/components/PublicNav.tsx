import { Link } from 'react-router-dom';
import { useAuthLoggedIn } from '../hooks/useAuthLoggedIn';

type PublicNavProps = {
  variant?: 'dark' | 'light';
};

const marketingLinks = [
  { href: '#features', label: 'Features' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#resources', label: 'Resources' },
  { href: '#about', label: 'About us' },
];

export function PublicNav({ variant = 'dark' }: PublicNavProps) {
  const loggedIn = useAuthLoggedIn();
  const isLight = variant === 'light';

  return (
    <header className={`public-nav${isLight ? ' public-nav--light' : ''}`}>
      <Link to="/" className="public-nav__brand">
        {isLight ? (
          <>
            <span className="public-nav__logo-icon" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </span>
            <span className="public-nav__brand-copy">
              <span className="public-nav__brand-name">E-Watu</span>
              <span className="public-nav__brand-sub">HR operations platform</span>
            </span>
          </>
        ) : (
          <>
            <span className="public-nav__mark" aria-hidden />
            E-Watu
          </>
        )}
      </Link>

      {isLight ? (
        <nav className="public-nav__links public-nav__links--center" aria-label="Primary">
          {marketingLinks.map((link) => (
            <a key={link.label} className="public-nav__link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      ) : (
        <nav className="public-nav__links" aria-label="Primary">
          <a className="public-nav__link" href="/#features">
            Features
          </a>
          <a className="public-nav__link" href="/#how">
            How it works
          </a>
        </nav>
      )}

      <div className="public-nav__actions">
        {loggedIn ? (
          <Link to="/platform" className="btn btn--nav-primary">
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" className={`public-nav__link${isLight ? ' public-nav__link--button' : ''}`}>
              Log in
            </Link>
            <Link to="/register-company" className="btn btn--nav-primary">
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

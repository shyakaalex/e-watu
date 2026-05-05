import { Link } from 'react-router-dom';
import { useAuthLoggedIn } from '../hooks/useAuthLoggedIn';

export function PublicNav() {
  const loggedIn = useAuthLoggedIn();

  return (
    <header className="public-nav">
      <Link to="/" className="public-nav__brand">
        <span className="public-nav__mark" aria-hidden />
        E-Watu
      </Link>
      <nav className="public-nav__links" aria-label="Primary">
        <a className="public-nav__link" href="/#features">
          Features
        </a>
        <a className="public-nav__link" href="/#how">
          How it works
        </a>
        {loggedIn ? (
          <Link to="/platform" className="btn btn--nav-primary">
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" className="public-nav__link">
              Sign in
            </Link>
            <Link to="/register-company" className="btn btn--nav-primary">
              Apply
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

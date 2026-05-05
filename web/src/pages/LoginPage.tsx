import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginRequest } from '../api';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthLoggedIn } from '../hooks/useAuthLoggedIn';
import { resolveReturnPath } from '../lib/returnPath';

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = useAuthLoggedIn();
  const sp = new URLSearchParams(location.search);
  const fromState = (location.state as { from?: string } | null)?.from;
  const returnPath = resolveReturnPath(sp, fromState, '/platform');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loggedIn) {
    return <Navigate to={returnPath} replace />;
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await loginRequest(email.trim(), password);
      navigate(returnPath, { replace: true });
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      try {
        const j = JSON.parse(raw) as { message?: string | string[] };
        const m = j.message;
        setErr(Array.isArray(m) ? m.join(', ') : m ?? raw);
      } catch {
        setErr(raw);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      introEyebrow="Sign in"
      introTitle="Welcome back"
      introContent={
        <>
          <p className="auth-intro__lead">
            Access your workspace with the administrator email you verified during registration.
          </p>
          <ul className="auth-intro__list">
            <li>Company owners must complete email verification before first login.</li>
            <li>Your dashboard reflects your role: platform operator or company administrator.</li>
          </ul>
        </>
      }
    >
      <h2 className="auth-heading auth-heading--compact">Sign in</h2>
      <p className="auth-lead auth-lead--tight">Enter your credentials to continue.</p>
      {err && (
        <div className="alert alert--err" role="alert">
          {err}
        </div>
      )}
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-label">
          Email address
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
            placeholder="you@company.com"
          />
        </label>
        <label className="auth-label">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
            placeholder="••••••••"
          />
        </label>
        <button type="submit" className="btn btn--block btn--primary btn--lg" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="auth-alt">
        New company?{' '}
        <Link to="/register-company" className="auth-alt__emph">
          Apply for a workspace
        </Link>
      </p>
      <p className="auth-footnote">
        <Link to="/">← Back to home</Link>
      </p>
    </AuthLayout>
  );
}

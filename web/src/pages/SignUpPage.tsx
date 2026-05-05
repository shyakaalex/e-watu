import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { registerRequest } from '../api';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthLoggedIn } from '../hooks/useAuthLoggedIn';
import { resolveReturnPath } from '../lib/returnPath';

export function SignUpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = useAuthLoggedIn();
  const sp = new URLSearchParams(location.search);
  const fromState = (location.state as { from?: string } | null)?.from;
  const returnPath = resolveReturnPath(sp, fromState, '/platform');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
      await registerRequest(email.trim(), password, displayName.trim() || undefined);
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
      introEyebrow="Platform setup"
      introTitle="Operator account"
      introContent={
        <>
          <p className="auth-intro__lead">
            This path is only for the <strong>first</strong> user in an empty system. It creates a platform super
            administrator with a verified email so you can approve tenants and manage the control plane.
          </p>
          <ul className="auth-intro__list">
            <li>
              <strong>HR firms</strong> should use{' '}
              <Link to="/register-company" className="auth-intro__inline-link">
                company registration
              </Link>{' '}
              instead.
            </li>
            <li>If users already exist, this form will not succeed—use sign in for your role.</li>
          </ul>
        </>
      }
    >
      <h2 className="auth-heading auth-heading--compact">Create operator account</h2>
      <p className="auth-lead auth-lead--tight">Bootstrap only when the user directory is empty.</p>
      {err && (
        <div className="alert alert--err" role="alert">
          {err}
        </div>
      )}
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-label">
          Work email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
            placeholder="ops@your-host.com"
          />
        </label>
        <label className="auth-label">
          Display name <span className="muted small fw-normal">optional</span>
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="auth-input"
            maxLength={120}
            placeholder="Your name"
          />
        </label>
        <label className="auth-label">
          Password <span className="muted small fw-normal">minimum 10 characters</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
            className="auth-input"
            placeholder="Strong passphrase"
          />
        </label>
        <button type="submit" className="btn btn--block btn--primary btn--lg" disabled={busy}>
          {busy ? 'Creating account…' : 'Create operator account'}
        </button>
      </form>
      <p className="auth-alt">
        Applying as a company?{' '}
        <Link to="/register-company" className="auth-alt__emph">
          Register your organization
        </Link>
        <span className="auth-alt__sep">·</span>
        <Link to="/login">Sign in</Link>
      </p>
      <p className="auth-footnote">
        <Link to="/">← Back to home</Link>
      </p>
    </AuthLayout>
  );
}

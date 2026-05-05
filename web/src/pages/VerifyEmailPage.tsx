import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmailRequest } from '../api';
import { AuthLayout } from '../components/AuthLayout';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('err');
      setMsg('Missing token in URL.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await verifyEmailRequest(token);
        if (!cancelled) {
          setStatus('ok');
          setMsg('Your administrator email is verified. Once your workspace is approved, you can sign in.');
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('err');
          setMsg(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthLayout
      introEyebrow="Security"
      introTitle="Email verification"
      introContent={
        <>
          <p className="auth-intro__lead">
            We confirm your inbox before activating sign-in. This step completes the link between your tenant application
            and the administrator identity.
          </p>
          <ul className="auth-intro__list">
            <li>Use the link from your verification email (or the demo link shown after registration).</li>
            <li>Approval is still required before day-to-day use of the tenant.</li>
          </ul>
        </>
      }
    >
      {status === 'idle' && (
        <div className="auth-verify-idle">
          <div className="auth-spinner" aria-hidden />
          <p className="auth-heading auth-heading--compact">Confirming your inbox…</p>
          <p className="auth-lead auth-lead--tight">This usually takes a moment.</p>
        </div>
      )}
      {status === 'ok' && (
        <div className="auth-success auth-success--compact">
          <div className="auth-success__icon auth-success__icon--sm" aria-hidden>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <path
                d="M14 24l8 8 12-16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="auth-heading">You’re verified</h2>
          <p className="auth-lead auth-lead--tight">{msg}</p>
          <Link to="/login" className="btn btn--primary btn--lg btn--block">
            Continue to sign in
          </Link>
          <p className="auth-footnote auth-footnote--center">
            <Link to="/">← Back to home</Link>
          </p>
        </div>
      )}
      {status === 'err' && (
        <>
          <h2 className="auth-heading auth-heading--compact">Couldn’t verify</h2>
          <div className="alert alert--err" role="alert">
            {msg}
          </div>
          <p className="auth-alt">
            <Link to="/register-company">Apply for workspace</Link>
            <span className="auth-alt__sep">·</span>
            <Link to="/login">Sign in</Link>
          </p>
          <p className="auth-footnote">
            <Link to="/">← Back to home</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

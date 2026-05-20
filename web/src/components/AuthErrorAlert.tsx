import type { ParsedApiError } from '../lib/parseApiError';

type Props = {
  error: ParsedApiError;
};

function Icon({ variant }: { variant: ParsedApiError['variant'] }) {
  if (variant === 'warning') {
    return (
      <svg className="auth-error__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 7v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="auth-error__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AuthErrorAlert({ error }: Props) {
  return (
    <div className={`auth-error auth-error--${error.variant}`} role="alert" aria-live="polite">
      <Icon variant={error.variant} />
      <div className="auth-error__body">
        <p className="auth-error__title">{error.title}</p>
        <p className="auth-error__message">{error.message}</p>
      </div>
    </div>
  );
}

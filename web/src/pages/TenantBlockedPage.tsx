import { useSearchParams } from 'react-router-dom';
import { clearAuthTokens } from '../api';
import { AuthLayout } from '../components/AuthLayout';

const MESSAGES: Record<string, { title: string; body: string }> = {
  TENANT_SUSPENDED: {
    title: 'Company account suspended',
    body: 'This company account has been suspended. Please contact your administrator for details.',
  },
  TENANT_EXPIRED: {
    title: 'Subscription expired',
    body: "This company's subscription has expired. Please renew to continue using E-Watu.",
  },
  TENANT_PENDING_ACTIVATION: {
    title: 'Awaiting approval',
    body: 'Your company registration is still under review by the platform team. Full access unlocks once approved.',
  },
  TENANT_REJECTED: {
    title: 'Registration not approved',
    body: "This company's registration was not approved. Please contact support if you believe this is an error.",
  },
};

export function TenantBlockedPage() {
  const [params] = useSearchParams();
  const code = params.get('code') ?? '';
  const copy = MESSAGES[code] ?? {
    title: 'Access restricted',
    body: 'This company account cannot access E-Watu right now.',
  };

  const onSignOut = () => {
    clearAuthTokens();
    window.location.href = '/login';
  };

  return (
    <AuthLayout introEyebrow="Company access" introTitle={copy.title} introContent={<></>}>
      <h2 className="auth-heading auth-heading--compact">{copy.title}</h2>
      <p className="auth-lead auth-lead--tight">{copy.body}</p>
      <button type="button" className="btn btn--block btn--primary btn--lg" onClick={onSignOut} style={{ marginTop: '1.25rem' }}>
        Sign out
      </button>
    </AuthLayout>
  );
}

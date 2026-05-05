import { getAccessToken, setAccessToken } from './auth/token';

export { setAccessToken };

function platformUrl(): string {
  return import.meta.env.VITE_PLATFORM_API ?? 'http://localhost:3012';
}

function identityUrl(): string {
  return import.meta.env.VITE_IDENTITY_API ?? 'http://localhost:3011';
}

export async function authFetch(url: string, init: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const r = await fetch(url, { ...init, headers });
  if (r.status === 401) {
    setAccessToken(null);
  }
  return r;
}

export async function loginRequest(email: string, password: string) {
  const r = await fetch(`${identityUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `${r.status}`);
  const data = JSON.parse(text) as { access_token: string };
  setAccessToken(data.access_token);
}

export async function registerRequest(
  email: string,
  password: string,
  displayName?: string,
) {
  const r = await fetch(`${identityUrl()}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `${r.status}`);
  const data = JSON.parse(text) as { access_token: string };
  setAccessToken(data.access_token);
}

export async function fetchMe() {
  const r = await authFetch(`${identityUrl()}/api/v1/me`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json() as Promise<{
    sub: string;
    email?: string;
    username?: string;
    roles: string[];
    tenant_id?: string;
  }>;
}

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string | null;
  country: string | null;
  businessEmail?: string | null;
  phone?: string | null;
  ownerUserId?: string | null;
  emailVerifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
};

export async function registerCompany(body: {
  companyName: string;
  businessEmail: string;
  phone: string;
  country: string;
  adminEmail: string;
  adminPassword: string;
  adminDisplayName?: string;
}) {
  const r = await fetch(`${platformUrl()}/api/v1/onboarding/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `${r.status}`);
  return JSON.parse(text) as {
    message: string;
    tenantId: string;
    slug: string;
    access?: { subdomainExample: string; pathExample: string };
    devVerifyUrl?: string;
  };
}

export async function verifyEmailRequest(token: string) {
  const r = await fetch(`${identityUrl()}/api/v1/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `${r.status}`);
  return JSON.parse(text) as { verified: boolean };
}

export async function fetchMyTenant() {
  const r = await authFetch(`${platformUrl()}/api/v1/my/tenant`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json() as Promise<TenantRow | null>;
}

export async function fetchPendingTenants() {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants/pending`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json() as Promise<TenantRow[]>;
}

export async function approveTenant(id: string) {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants/${id}/approve`, {
    method: 'PATCH',
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json() as Promise<TenantRow>;
}

export async function rejectTenant(id: string, reason?: string) {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json() as Promise<TenantRow>;
}

export async function fetchTenants() {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json() as Promise<TenantRow[]>;
}

export async function createTenant(body: {
  name: string;
  slug: string;
  plan?: string;
  country?: string;
}) {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json() as Promise<TenantRow>;
}

export { subscribeAuth, isAuthenticatedSnapshot } from './auth/token';

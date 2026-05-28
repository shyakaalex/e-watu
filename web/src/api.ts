import { setAccessToken, setRefreshToken, clearAuthTokens as clearStoredAuthTokens } from './auth/token';
import { authFetch, parseJson, scheduleProactiveTokenRefresh, serviceUrl } from './lib/http';

export { setAccessToken };

const identityUrl = () => serviceUrl('identity');
const platformUrl = () => serviceUrl('platform');
const notificationUrl = () => serviceUrl('notification');

type MePayload = {
  sub: string;
  email?: string;
  username?: string;
  roles: string[];
  tenant_id?: string;
};

let meCache: MePayload | null = null;
let meCacheAt = 0;
let meInFlight: Promise<MePayload> | null = null;
let meBackoffUntil = 0;

const ME_CACHE_MS = 15_000;
const ME_429_BACKOFF_MS = 5_000;

export async function loginRequest(email: string, password: string) {
  const r = await fetch(`${identityUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await parseJson<{
    access_token: string;
    refresh_token: string;
    token_type: string;
  }>(r);
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);
  meCache = null;
  meCacheAt = 0;
  meBackoffUntil = 0;
  scheduleProactiveTokenRefresh();
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
  if (!r.ok) throw new Error(await r.text());
  const data = await parseJson<{
    access_token: string;
    refresh_token: string;
    token_type: string;
  }>(r);
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);
  meCache = null;
  meCacheAt = 0;
  meBackoffUntil = 0;
  scheduleProactiveTokenRefresh();
}

export async function fetchMe(options?: { force?: boolean }) {
  const force = options?.force ?? false;
  const now = Date.now();

  if (!force && meCache && now - meCacheAt < ME_CACHE_MS) {
    return meCache;
  }

  if (meInFlight) return meInFlight;

  if (!force && now < meBackoffUntil) {
    throw new Error('429: Too Many Requests');
  }

  meInFlight = (async () => {
    const r = await authFetch(`${identityUrl()}/api/v1/me`);
    if (!r.ok) {
      if (r.status === 429) {
        meBackoffUntil = Date.now() + ME_429_BACKOFF_MS;
      }
      throw new Error(`${r.status}: ${await r.text()}`);
    }
    const me = await parseJson<MePayload>(r);
    meCache = me;
    meCacheAt = Date.now();
    meBackoffUntil = 0;
    return me;
  })().finally(() => {
    meInFlight = null;
  });

  return meInFlight;
}

export function clearAuthTokens() {
  meCache = null;
  meCacheAt = 0;
  meInFlight = null;
  meBackoffUntil = 0;
  clearStoredAuthTokens();
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
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  website?: string | null;
  baseCurrency?: string | null;
  fiscalYearStartMonth?: number | null;
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
  if (!r.ok) throw new Error(await r.text());
  return parseJson<{
    message: string;
    tenantId: string;
    slug: string;
    access?: { subdomainExample: string; pathExample: string };
    devVerifyUrl?: string;
  }>(r);
}

export async function verifyEmailRequest(token: string) {
  const r = await fetch(`${identityUrl()}/api/v1/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!r.ok) throw new Error(await r.text());
  return parseJson<{ verified: boolean }>(r);
}

export async function fetchMyTenant() {
  const r = await authFetch(`${platformUrl()}/api/v1/my/tenant`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<TenantRow | null>(r);
}

export async function fetchPendingTenants() {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants/pending`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<TenantRow[]>(r);
}

export async function approveTenant(id: string) {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants/${id}/approve`, {
    method: 'PATCH',
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<TenantRow>(r);
}

export async function rejectTenant(id: string, reason?: string) {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<TenantRow>(r);
}

export async function fetchTenants() {
  const r = await authFetch(`${platformUrl()}/api/v1/tenants`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<TenantRow[]>(r);
}

export async function updateTenantSettings(body: {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  website?: string;
  baseCurrency?: string;
  fiscalYearStartMonth?: number;
}) {
  const r = await authFetch(`${platformUrl()}/api/v1/my/tenant/settings`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<TenantRow>(r);
}

export type UserRow = {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
};

export async function fetchTenantUsers() {
  const r = await authFetch(`${identityUrl()}/api/v1/users`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<UserRow[]>(r);
}

export async function createTenantUser(body: {
  email: string;
  password: string;
  displayName?: string;
  roles: string[];
}) {
  const r = await authFetch(`${identityUrl()}/api/v1/users`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<UserRow & { emailVerificationToken?: string }>(r);
}

export async function updateTenantUser(
  id: string,
  body: { displayName?: string; roles?: string[]; active?: boolean },
) {
  const r = await authFetch(`${identityUrl()}/api/v1/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<UserRow>(r);
}

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export async function fetchNotifications(unreadOnly = false) {
  const q = unreadOnly ? '?unread=true' : '';
  const r = await authFetch(`${notificationUrl()}/api/v1/notifications${q}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<InAppNotification[]>(r);
}

export async function markNotificationRead(id: string) {
  const r = await authFetch(`${notificationUrl()}/api/v1/notifications/${id}/read`, {
    method: 'PATCH',
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
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
  return parseJson<TenantRow>(r);
}

export type ServiceHealth = {
  name: string;
  url: string;
  ok: boolean;
  status?: number;
  detail?: string;
};

async function pingHealth(name: string, base: string, path: string): Promise<ServiceHealth> {
  const url = `${base.replace(/\/$/, '')}${path}`;
  try {
    const r = await fetch(url);
    const ok = r.ok;
    let detail: string | undefined;
    if (ok) {
      try {
        const j = await parseJson<{ status?: string; service?: string }>(r);
        detail = j.status ?? j.service ?? 'ok';
      } catch {
        detail = 'ok';
      }
    } else {
      detail = await r.text();
    }
    return { name, url, ok, status: r.status, detail };
  } catch (e) {
    return {
      name,
      url,
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function fetchAllServiceHealth(): Promise<ServiceHealth[]> {
  const gateway = import.meta.env.VITE_API_URL;
  if (gateway) {
    return Promise.all([
      pingHealth('Gateway', gateway.replace(/\/$/, ''), '/health'),
    ]);
  }

  return Promise.all([
    pingHealth('Identity', serviceUrl('identity'), '/api/v1/identity/health'),
    pingHealth('Platform', serviceUrl('platform'), '/api/v1/platform/health'),
    pingHealth('Recruitment', serviceUrl('recruitment'), '/api/v1/recruitment/health'),
    pingHealth('Payroll', import.meta.env.VITE_PAYROLL_API ?? 'http://localhost:3016', '/api/v1/payroll/health'),
    pingHealth('Document', serviceUrl('document'), '/api/v1/document/health'),
    pingHealth('Notification', serviceUrl('notification'), '/api/v1/notifications/health'),
  ]);
}

export { subscribeAuth, isAuthenticatedSnapshot } from './auth/token';
export { authFetch } from './lib/http';

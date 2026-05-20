import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../auth/token';
import { getJwtExpMs, isAuthFailureStatus } from './auth-session';

export type ApiEnvelope<T> = {
  data: T;
  meta: { requestId: string; timestamp: string };
};

export function apiBase(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (base && String(base).trim() !== '') {
    return String(base).replace(/\/$/, '');
  }
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export function serviceUrl(
  service: 'identity' | 'platform' | 'recruitment' | 'notification' | 'document',
): string {
  const gateway = apiBase();
  if (gateway) return gateway;

  const map: Record<typeof service, string> = {
    identity: import.meta.env.VITE_IDENTITY_API ?? 'http://localhost:3011',
    platform: import.meta.env.VITE_PLATFORM_API ?? 'http://localhost:3012',
    recruitment: import.meta.env.VITE_RECRUITMENT_API ?? 'http://localhost:3013',
    notification: import.meta.env.VITE_NOTIFICATION_API ?? 'http://localhost:3015',
    document: import.meta.env.VITE_DOCUMENT_API ?? 'http://localhost:3018',
  };
  return map[service].replace(/\/$/, '');
}

export async function parseJson<T>(r: Response): Promise<T> {
  const text = await r.text();
  if (!text) return undefined as T;
  const parsed = JSON.parse(text) as T | ApiEnvelope<T>;
  if (parsed && typeof parsed === 'object' && 'data' in parsed && 'meta' in parsed) {
    return (parsed as ApiEnvelope<T>).data;
  }
  return parsed as T;
}

let refreshInFlight: Promise<boolean> | null = null;
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

function clearSessionAndRedirect(): void {
  clearAuthTokens();
  stopProactiveTokenRefresh();
  redirectToLogin();
}

/** Refresh access token ~2 minutes before JWT expiry to avoid 401 bursts. */
export function scheduleProactiveTokenRefresh(): void {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (!access || !refresh) return;

  const expMs = getJwtExpMs(access);
  if (!expMs) return;

  const refreshAt = expMs - 2 * 60 * 1000;
  const delay = Math.max(refreshAt - Date.now(), 10_000);

  proactiveRefreshTimer = setTimeout(async () => {
    const ok = await tryRefreshAccessToken();
    if (ok) scheduleProactiveTokenRefresh();
  }, delay);
}

export function stopProactiveTokenRefresh(): void {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const r = await fetch(`${serviceUrl('identity')}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!r.ok) {
          if (isAuthFailureStatus(r.status)) {
            clearSessionAndRedirect();
          }
          return false;
        }
        const data = await parseJson<{
          access_token: string;
          refresh_token: string;
        }>(r);
        if (!data?.access_token || !data?.refresh_token) return false;
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        scheduleProactiveTokenRefresh();
        return true;
      } catch {
        // Network blip — keep tokens; caller may retry later
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
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

  let r = await fetch(url, { ...init, headers });

  if (r.status === 401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      const newToken = getAccessToken();
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (method !== 'GET' && method !== 'HEAD' && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      r = await fetch(url, { ...init, headers: retryHeaders });
    }
    if (r.status === 401) {
      clearSessionAndRedirect();
      return new Response(null, { status: 401 });
    }
  }

  return r;
}

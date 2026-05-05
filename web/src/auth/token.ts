const STORAGE_KEY = 'ewatu_access_token';

const EVT = 'ewatu-auth-change';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } finally {
    window.dispatchEvent(new Event(EVT));
  }
}

export function subscribeAuth(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

export function isAuthenticatedSnapshot(): boolean {
  return !!getAccessToken();
}

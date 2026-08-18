const ACCESS_KEY = 'ewatu_access_token';
const REFRESH_KEY = 'ewatu_refresh_token';
const REMEMBER_KEY = 'ewatu_remember_me';
const EVT = 'ewatu-auth-change';

/** "Remember me" unchecked → tokens live in sessionStorage and disappear when the browser closes. */
function activeStorage(): Storage {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '0' ? sessionStorage : localStorage;
  } catch {
    return localStorage;
  }
}

function inactiveStorage(): Storage {
  return activeStorage() === localStorage ? sessionStorage : localStorage;
}

/** Call before login so the tokens land in the right storage. Defaults to remembered (localStorage). */
export function setRememberMe(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  } catch {
    // ignore
  }
}

export function getAccessToken(): string | null {
  try {
    return activeStorage().getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    const store = activeStorage();
    if (token) store.setItem(ACCESS_KEY, token);
    else store.removeItem(ACCESS_KEY);
    inactiveStorage().removeItem(ACCESS_KEY);
  } finally {
    window.dispatchEvent(new Event(EVT));
  }
}

export function getRefreshToken(): string | null {
  try {
    return activeStorage().getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    const store = activeStorage();
    if (token) store.setItem(REFRESH_KEY, token);
    else store.removeItem(REFRESH_KEY);
    inactiveStorage().removeItem(REFRESH_KEY);
  } finally {
    window.dispatchEvent(new Event(EVT));
  }
}

export function clearAuthTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

export function subscribeAuth(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

export function isAuthenticatedSnapshot(): boolean {
  return !!getAccessToken();
}

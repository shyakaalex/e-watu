/** Decode JWT `exp` (seconds) without verifying — used only for client-side refresh timing. */
export function getJwtExpMs(accessToken: string): number | null {
  try {
    const part = accessToken.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAuthFailureStatus(status: number): boolean {
  return status === 401 || status === 403;
}

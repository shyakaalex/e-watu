import { useEffect } from 'react';
import { fetchMyTenant } from '../api';
import { subscribeAuth, isAuthenticatedSnapshot } from '../auth/token';
import { applyTenantTheme } from './tenantTheme';

/** Mounted once at the app root. Applies the logged-in user's tenant brand colors on
 *  login/refresh, and clears them back to the default theme on logout. */
export function useTenantThemeSync(): void {
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!isAuthenticatedSnapshot()) {
        applyTenantTheme(null);
        return;
      }
      try {
        const tenant = await fetchMyTenant();
        if (!cancelled) applyTenantTheme(tenant);
      } catch {
        if (!cancelled) applyTenantTheme(null);
      }
    };

    sync();
    const unsubscribe = subscribeAuth(sync);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}

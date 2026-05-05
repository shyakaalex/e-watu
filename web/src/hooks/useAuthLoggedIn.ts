import { useSyncExternalStore } from 'react';
import { isAuthenticatedSnapshot, subscribeAuth } from '../auth/token';

export function useAuthLoggedIn(): boolean {
  return useSyncExternalStore(subscribeAuth, isAuthenticatedSnapshot, () => false);
}

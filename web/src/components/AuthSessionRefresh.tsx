import { useEffect } from 'react';
import { getAccessToken } from '../auth/token';
import { scheduleProactiveTokenRefresh, stopProactiveTokenRefresh } from '../lib/http';

/** Keeps the access token fresh while the user has a tab open (JWT default: 15 minutes). */
export function AuthSessionRefresh() {
  useEffect(() => {
    if (getAccessToken()) scheduleProactiveTokenRefresh();
    return () => stopProactiveTokenRefresh();
  }, []);
  return null;
}

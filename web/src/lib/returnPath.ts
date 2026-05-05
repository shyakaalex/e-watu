
export function isSafeInternalPath(p: string): boolean {
  return p.startsWith('/') && !p.startsWith('//') && !p.includes(':');
}

export function resolveReturnPath(
  searchParams: URLSearchParams,
  statePath: string | null | undefined,
  defaultPath = '/platform',
): string {
  if (statePath && isSafeInternalPath(statePath)) return statePath;
  const next = searchParams.get('next');
  if (next && isSafeInternalPath(next)) return next;
  return defaultPath;
}

export function absoluteReturnUrl(path: string): string {
  return `${window.location.origin}${path}`;
}

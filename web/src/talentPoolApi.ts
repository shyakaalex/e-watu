import { authFetch, parseJson } from './lib/http';

function tpUrl(): string {
  const base = import.meta.env.VITE_TALENT_POOL_API ?? 'http://localhost:3014';
  return base.replace(/\/$/, '');
}

export type TalentPool = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { profiles: number };
  profiles?: TalentPoolProfile[];
};

export type TalentPoolProfile = {
  id: string;
  tenantId: string;
  poolId: string;
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  tags: string[];
  source: string | null;
  notes: string | null;
  addedAt: string;
};

export type ProfileSearchResult = {
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  tags: string[];
  source: string | null;
  pools: { id: string; name: string }[];
};

export type SavedSearch = {
  id: string;
  tenantId: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
};

export async function fetchPools(tags?: string[]): Promise<TalentPool[]> {
  const params = new URLSearchParams();
  tags?.forEach((t) => params.append('tags', t));
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${tpUrl()}/api/v1/pools${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchPool(id: string): Promise<TalentPool> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function createPool(body: {
  name: string;
  description?: string;
  tags?: string[];
}): Promise<TalentPool> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools`, { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function updatePool(
  id: string,
  body: Partial<{ name: string; description: string; tags: string[] }>,
): Promise<TalentPool> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function deletePool(id: string): Promise<void> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

export async function addCandidateToPool(
  poolId: string,
  body: {
    candidateId: string;
    notes?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    tags?: string[];
    source?: string;
  },
): Promise<TalentPoolProfile> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${poolId}/candidates`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function removeCandidateFromPool(poolId: string, candidateId: string): Promise<void> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${poolId}/candidates/${candidateId}`, {
    method: 'DELETE',
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

export async function fetchProfiles(filters?: {
  q?: string;
  tags?: string[];
  source?: string;
  poolId?: string;
}): Promise<ProfileSearchResult[]> {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  if (filters?.source) params.set('source', filters.source);
  if (filters?.poolId) params.set('poolId', filters.poolId);
  filters?.tags?.forEach((t) => params.append('tags', t));
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${tpUrl()}/api/v1/profiles${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const r = await authFetch(`${tpUrl()}/api/v1/saved-searches`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function createSavedSearch(name: string, filters: Record<string, unknown>): Promise<SavedSearch> {
  const r = await authFetch(`${tpUrl()}/api/v1/saved-searches`, {
    method: 'POST',
    body: JSON.stringify({ name, filters }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const r = await authFetch(`${tpUrl()}/api/v1/saved-searches/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

export async function runSavedSearch(id: string): Promise<ProfileSearchResult[]> {
  const r = await authFetch(`${tpUrl()}/api/v1/saved-searches/${id}/run`, { method: 'POST' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

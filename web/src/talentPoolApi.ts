import { authFetch } from './api';

function tpUrl(): string {
  return import.meta.env.VITE_TALENT_POOL_API ?? 'http://localhost:3014';
}

// ── Types ─────────────────────────────────────────────────────────────────

export type AvailabilityStatus = 'AVAILABLE' | 'OPEN_TO_OFFERS' | 'NOT_LOOKING' | 'UNKNOWN';
export type EducationLevel = 'HIGH_SCHOOL' | 'DIPLOMA' | 'BACHELOR' | 'MASTER' | 'PHD' | 'OTHER';
export type ProfileSource = 'DIRECT' | 'REFERRAL' | 'JOB_BOARD' | 'LINKEDIN' | 'RECRUITMENT' | 'OTHER';

export type CandidateProfile = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentTitle: string | null;
  location: string | null;
  summary: string | null;
  cvUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  languages: string[];
  tags: string[];
  certifications: string[];
  yearsExperience: number | null;
  educationLevel: EducationLevel | null;
  availableFrom: string | null;
  availabilityStatus: AvailabilityStatus;
  source: ProfileSource;
  recruitmentCandidateId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PoolMember = {
  id: string;
  tenantId: string;
  poolId: string;
  profileId: string;
  fitScore: number | null;
  notes: string | null;
  addedAt: string;
  profile: CandidateProfile;
};

export type TalentPool = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  tags: string[];
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
  members?: PoolMember[];
};

export type SavedSearch = {
  id: string;
  tenantId: string;
  name: string;
  filters: ProfileSearchFilters;
  createdAt: string;
  updatedAt: string;
};

export type ProfileSearchFilters = {
  q?: string;
  skills?: string[];
  tags?: string[];
  location?: string;
  availabilityStatus?: string;
  minExperience?: number;
  educationLevel?: string;
};

// ── Profiles ──────────────────────────────────────────────────────────────

export async function fetchProfiles(filters?: ProfileSearchFilters): Promise<CandidateProfile[]> {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  if (filters?.location) params.set('location', filters.location);
  if (filters?.availabilityStatus) params.set('availabilityStatus', filters.availabilityStatus);
  if (filters?.minExperience !== undefined) params.set('minExperience', String(filters.minExperience));
  if (filters?.educationLevel) params.set('educationLevel', filters.educationLevel);
  filters?.skills?.forEach((s) => params.append('skills', s));
  filters?.tags?.forEach((t) => params.append('tags', t));
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${tpUrl()}/api/v1/profiles${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function fetchProfile(id: string): Promise<CandidateProfile & { memberships: (PoolMember & { pool: TalentPool })[] }> {
  const r = await authFetch(`${tpUrl()}/api/v1/profiles/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createProfile(body: Partial<CandidateProfile> & { firstName: string; lastName: string; email: string }): Promise<CandidateProfile> {
  const r = await authFetch(`${tpUrl()}/api/v1/profiles`, { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function updateProfile(id: string, body: Partial<CandidateProfile>): Promise<CandidateProfile> {
  const r = await authFetch(`${tpUrl()}/api/v1/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function deleteProfile(id: string): Promise<void> {
  const r = await authFetch(`${tpUrl()}/api/v1/profiles/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

// ── Pools ─────────────────────────────────────────────────────────────────

export async function fetchPools(): Promise<TalentPool[]> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function fetchPool(id: string): Promise<TalentPool> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createPool(body: { name: string; description?: string; tags?: string[] }): Promise<TalentPool> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools`, { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function updatePool(id: string, body: Partial<{ name: string; description: string; tags: string[] }>): Promise<TalentPool> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function deletePool(id: string): Promise<void> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

export async function addToPool(poolId: string, profileId: string, fitScore?: number, notes?: string): Promise<PoolMember> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${poolId}/members`, {
    method: 'POST',
    body: JSON.stringify({ profileId, fitScore, notes }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function removeFromPool(poolId: string, memberId: string): Promise<void> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${poolId}/members/${memberId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

export async function updateMember(poolId: string, memberId: string, body: { fitScore?: number; notes?: string }): Promise<PoolMember> {
  const r = await authFetch(`${tpUrl()}/api/v1/pools/${poolId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

// ── Saved searches ────────────────────────────────────────────────────────

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const r = await authFetch(`${tpUrl()}/api/v1/searches`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createSavedSearch(name: string, filters: ProfileSearchFilters): Promise<SavedSearch> {
  const r = await authFetch(`${tpUrl()}/api/v1/searches`, {
    method: 'POST',
    body: JSON.stringify({ name, filters }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const r = await authFetch(`${tpUrl()}/api/v1/searches/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

export async function runSavedSearch(id: string): Promise<CandidateProfile[]> {
  const r = await authFetch(`${tpUrl()}/api/v1/searches/${id}/run`, { method: 'POST' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

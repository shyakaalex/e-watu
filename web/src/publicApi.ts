import { parseJson, serviceUrl } from './lib/http';

export type PublicTenant = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  website: string | null;
};

export type PublicJob = {
  id: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  type: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  postedAt: string | null;
};

export async function fetchPublicTenant(slug: string): Promise<PublicTenant> {
  const r = await fetch(
    `${serviceUrl('platform')}/api/v1/public/tenants/${encodeURIComponent(slug)}`,
  );
  if (!r.ok) throw new Error(r.status === 404 ? 'Company not found' : await r.text());
  return parseJson<PublicTenant>(r);
}

export async function fetchPublicJobs(slug: string): Promise<PublicJob[]> {
  const r = await fetch(
    `${serviceUrl('recruitment')}/api/v1/public/${encodeURIComponent(slug)}/jobs`,
  );
  if (!r.ok) throw new Error(await r.text());
  return parseJson<PublicJob[]>(r);
}

export async function submitPublicApplication(
  slug: string,
  jobId: string,
  body: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    coverLetter?: string;
    cvUrl?: string;
  },
) {
  const r = await fetch(
    `${serviceUrl('recruitment')}/api/v1/public/${encodeURIComponent(slug)}/jobs/${jobId}/apply`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!r.ok) throw new Error(await r.text());
  return parseJson<{ message: string }>(r);
}

export async function submitTalentPool(
  slug: string,
  body: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentTitle?: string;
    cvUrl?: string;
  },
) {
  const r = await fetch(
    `${serviceUrl('recruitment')}/api/v1/public/${encodeURIComponent(slug)}/talent-pool`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!r.ok) throw new Error(await r.text());
  return parseJson<{ message: string }>(r);
}

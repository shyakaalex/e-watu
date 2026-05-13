import { authFetch } from './api';

function recruitmentUrl(): string {
  return import.meta.env.VITE_RECRUITMENT_API ?? 'http://localhost:3013';
}

// ── Types ──────────────────────────────────────────────────────────────────

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'FILLED';

export type Job = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  type: JobType;
  status: JobStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  headcount: number;
  postedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateSource = 'REFERRAL' | 'JOB_BOARD' | 'DIRECT' | 'AGENCY' | 'OTHER';

export type Candidate = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  cvUrl: string | null;
  linkedinUrl: string | null;
  currentTitle: string | null;
  source: CandidateSource;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ApplicationStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED';

export type Application = {
  id: string;
  tenantId: string;
  jobId: string;
  candidateId: string;
  stage: ApplicationStage;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  candidate: Candidate;
  job: Job;
};

export type InterviewType = 'PHONE' | 'VIDEO' | 'ONSITE' | 'PANEL';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type Interview = {
  id: string;
  tenantId: string;
  applicationId: string;
  scheduledAt: string;
  durationMin: number;
  type: InterviewType;
  interviewerIds: string[];
  status: InterviewStatus;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
  application: Application;
};

export type Pipeline = {
  job: Job;
  pipeline: Record<ApplicationStage, Application[]>;
};

// ── Jobs ──────────────────────────────────────────────────────────────────

export async function fetchJobs(status?: string): Promise<Job[]> {
  const qs = status ? `?status=${status}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function fetchJob(id: string): Promise<Job> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function fetchJobPipeline(id: string): Promise<Pipeline> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}/pipeline`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createJob(body: {
  title: string;
  description?: string;
  department?: string;
  location?: string;
  type?: JobType;
  status?: JobStatus;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  headcount?: number;
}): Promise<Job> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function updateJob(id: string, body: Partial<Parameters<typeof createJob>[0]>): Promise<Job> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function deleteJob(id: string): Promise<void> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

// ── Candidates ────────────────────────────────────────────────────────────

export async function fetchCandidates(q?: string): Promise<Candidate[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function fetchCandidate(id: string): Promise<Candidate & { applications: (Application & { job: Job })[] }> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createCandidate(body: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cvUrl?: string;
  linkedinUrl?: string;
  currentTitle?: string;
  source?: CandidateSource;
  notes?: string;
  tags?: string[];
}): Promise<Candidate> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

// ── Applications ──────────────────────────────────────────────────────────

export async function fetchApplications(filters?: {
  jobId?: string;
  candidateId?: string;
  stage?: string;
}): Promise<Application[]> {
  const params = new URLSearchParams();
  if (filters?.jobId) params.set('jobId', filters.jobId);
  if (filters?.candidateId) params.set('candidateId', filters.candidateId);
  if (filters?.stage) params.set('stage', filters.stage);
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createApplication(body: {
  jobId: string;
  candidateId: string;
  notes?: string;
}): Promise<Application> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function moveApplicationStage(
  id: string,
  stage: ApplicationStage,
  notes?: string,
): Promise<Application> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage, notes }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

// ── Interviews ────────────────────────────────────────────────────────────

export async function fetchInterviews(applicationId?: string): Promise<Interview[]> {
  const qs = applicationId ? `?applicationId=${applicationId}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createInterview(body: {
  applicationId: string;
  scheduledAt: string;
  durationMin?: number;
  type?: InterviewType;
  interviewerIds?: string[];
  feedback?: string;
}): Promise<Interview> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function updateInterview(
  id: string,
  body: { status?: InterviewStatus; feedback?: string; scheduledAt?: string },
): Promise<Interview> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

import { authFetch, parseJson, serviceUrl } from './lib/http';

function recruitmentUrl(): string {
  return serviceUrl('recruitment');
}

// ── Types ──────────────────────────────────────────────────────────────────

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'FILLED' | 'CANCELLED';
export type JobPriority = 'STANDARD' | 'URGENT' | 'EXECUTIVE';
export type FeeType = 'PERCENTAGE' | 'FLAT_FEE' | 'MONTHLY_RETAINER';

export type Job = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  headcount: number;
  deadline: string | null;
  requiredSkills: string[];
  qualifications: string | null;
  clientId: string | null;
  clientName: string | null;
  consultantId: string | null;
  feeType: FeeType | null;
  feeValue: number | null;
  postedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobMetrics = {
  jobId: string;
  totalApplications: number;
  byStage: Record<string, number>;
  timeToDays: number | null;
  conversionRates: Record<string, number>;
};

export type CandidateSource =
  | 'E_WATU_PORTAL'
  | 'WEBSITE'
  | 'MANUAL'
  | 'REFERRAL'
  | 'LINKEDIN'
  | 'WALK_IN'
  | 'IMPORT';

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
  | 'SCREENED'
  | 'SHORTLISTED'
  | 'INTERVIEWED'
  | 'OFFERED'
  | 'PLACED'
  | 'REJECTED';

export type ApplicationSource = CandidateSource;

export type StageHistory = {
  id: string;
  applicationId: string;
  fromStage: string | null;
  toStage: string;
  changedBy: string;
  notes: string | null;
  createdAt: string;
};

export type Application = {
  id: string;
  tenantId: string;
  jobId: string;
  candidateId: string;
  stage: ApplicationStage;
  notes: string | null;
  rejectionReason: string | null;
  source: ApplicationSource;
  createdAt: string;
  updatedAt: string;
  candidate: Candidate;
  job: Job;
  interviews?: Interview[];
  stageHistory?: StageHistory[];
};

export type InterviewType = 'PHONE' | 'VIDEO' | 'IN_PERSON' | 'PANEL' | 'TECHNICAL';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type InterviewOutcome = 'ADVANCE' | 'HOLD' | 'SECOND_ROUND' | 'OFFER' | 'REJECT';

export type InterviewScorecard = {
  id: string;
  interviewId: string;
  competency: string;
  score: number;
  notes: string | null;
  submittedBy: string;
  createdAt: string;
};

export type Interview = {
  id: string;
  tenantId: string;
  applicationId: string;
  scheduledAt: string;
  durationMin: number;
  type: InterviewType;
  interviewerIds: string[];
  locationOrLink: string | null;
  status: InterviewStatus;
  outcome: InterviewOutcome | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
  application: Application;
  scorecards?: InterviewScorecard[];
};

export type Pipeline = {
  job: Job;
  pipeline: Record<ApplicationStage, Application[]>;
};

export type OfferStatus =
  | 'DRAFT'
  | 'SENT'
  | 'UNDER_REVIEW'
  | 'NEGOTIATING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type SignatureStatus = 'SENT' | 'VIEWED' | 'SIGNED';

export type Offer = {
  id: string;
  tenantId: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  salary: number;
  currency: string;
  startDate: string | null;
  probationDays: number;
  status: OfferStatus;
  offerLetterUrl: string | null;
  signatureStatus: SignatureStatus | null;
  counterNotes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  application: Application;
  placement: Placement | null;
};

export type InvoiceStatus = 'PENDING' | 'GENERATED' | 'SENT' | 'PAID';

export type Placement = {
  id: string;
  tenantId: string;
  offerId: string;
  jobId: string;
  candidateId: string;
  clientId: string | null;
  clientName: string | null;
  roleName: string;
  startDate: string;
  salary: number;
  currency: string;
  reportingLine: string | null;
  consultantId: string | null;
  invoiceStatus: InvoiceStatus;
  createdAt: string;
  offer: Offer;
};

// ── Jobs ──────────────────────────────────────────────────────────────────

export async function fetchJobs(filters?: { status?: string; priority?: string }): Promise<Job[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchJob(id: string): Promise<Job> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchJobPipeline(id: string): Promise<Pipeline> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}/pipeline`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchJobMetrics(id: string): Promise<JobMetrics> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}/metrics`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export function jobExportUrl(id: string): string {
  return `${recruitmentUrl()}/api/v1/jobs/${id}/export`;
}

export async function createJob(body: {
  title: string;
  description?: string;
  department?: string;
  location?: string;
  type?: JobType;
  status?: JobStatus;
  priority?: JobPriority;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  headcount?: number;
  deadline?: string;
  requiredSkills?: string[];
  qualifications?: string;
  clientId?: string;
  clientName?: string;
  consultantId?: string;
  feeType?: FeeType;
  feeValue?: number;
}): Promise<Job> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function updateJob(id: string, body: Partial<Parameters<typeof createJob>[0]>): Promise<Job> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
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
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchCandidate(id: string): Promise<Candidate & { applications: (Application & { job: Job })[] }> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
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
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
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
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchApplication(id: string): Promise<Application> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications/${id}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function fetchApplicationHistory(id: string): Promise<StageHistory[]> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications/${id}/history`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createApplication(body: {
  jobId: string;
  candidateId: string;
  notes?: string;
  source?: ApplicationSource;
}): Promise<Application> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function moveApplicationStage(
  id: string,
  stage: ApplicationStage,
  notes?: string,
  rejectionReason?: string,
): Promise<Application> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage, notes, rejectionReason }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function bulkMoveStage(
  applicationIds: string[],
  stage: ApplicationStage,
  notes?: string,
): Promise<{ updated: number }> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/applications/bulk/stage`, {
    method: 'POST',
    body: JSON.stringify({ applicationIds, stage, notes }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

// ── Interviews ────────────────────────────────────────────────────────────

export async function fetchInterviews(applicationId?: string): Promise<Interview[]> {
  const qs = applicationId ? `?applicationId=${applicationId}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function createInterview(body: {
  applicationId: string;
  scheduledAt: string;
  durationMin?: number;
  type?: InterviewType;
  interviewerIds?: string[];
  locationOrLink?: string;
  feedback?: string;
}): Promise<Interview> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function updateInterview(
  id: string,
  body: {
    status?: InterviewStatus;
    outcome?: InterviewOutcome;
    feedback?: string;
    scheduledAt?: string;
    locationOrLink?: string;
  },
): Promise<Interview> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function addScorecard(
  interviewId: string,
  body: { competency: string; score: number; notes?: string },
): Promise<InterviewScorecard> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews/${interviewId}/scorecards`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function fetchScorecards(interviewId: string): Promise<{
  scorecards: InterviewScorecard[];
  byCompetency: Record<string, { scores: number[]; avg: number }>;
  overallAvg: number | null;
}> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/interviews/${interviewId}/scorecards`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

// ── Offers ────────────────────────────────────────────────────────────────

export async function fetchOffers(filters?: {
  jobId?: string;
  candidateId?: string;
  status?: string;
}): Promise<Offer[]> {
  const params = new URLSearchParams();
  if (filters?.jobId) params.set('jobId', filters.jobId);
  if (filters?.candidateId) params.set('candidateId', filters.candidateId);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/offers${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createOffer(body: {
  applicationId: string;
  jobId: string;
  candidateId: string;
  salary: number;
  currency?: string;
  startDate?: string;
  probationDays?: number;
  status?: OfferStatus;
  offerLetterUrl?: string;
  counterNotes?: string;
}): Promise<Offer> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/offers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function updateOffer(
  id: string,
  body: {
    status?: OfferStatus;
    salary?: number;
    startDate?: string;
    probationDays?: number;
    offerLetterUrl?: string;
    signatureStatus?: SignatureStatus;
    counterNotes?: string;
  },
): Promise<Offer> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/offers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

// ── Placements ────────────────────────────────────────────────────────────

export async function fetchPlacements(filters?: {
  jobId?: string;
  candidateId?: string;
}): Promise<Placement[]> {
  const params = new URLSearchParams();
  if (filters?.jobId) params.set('jobId', filters.jobId);
  if (filters?.candidateId) params.set('candidateId', filters.candidateId);
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/placements${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function createPlacement(body: {
  offerId: string;
  jobId: string;
  candidateId: string;
  clientId?: string;
  clientName?: string;
  roleName: string;
  startDate: string;
  salary: number;
  currency?: string;
  reportingLine?: string;
  consultantId?: string;
}): Promise<Placement> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/placements`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export async function updatePlacementInvoice(
  id: string,
  invoiceStatus: InvoiceStatus,
): Promise<Placement> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/placements/${id}/invoice`, {
    method: 'PATCH',
    body: JSON.stringify({ invoiceStatus }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

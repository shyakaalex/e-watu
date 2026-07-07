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
  | 'IMPORT'
  | 'PORTAL';

export type CandidateStatus =
  | 'ACTIVE'
  | 'IN_PIPELINE'
  | 'PLACED'
  | 'PASSIVE'
  | 'DO_NOT_CONTACT'
  | 'ARCHIVED';

export type CandidateAvailability = 'IMMEDIATE' | 'FROM_DATE' | 'PASSIVE';

export type EmploymentStatus = 'EMPLOYED' | 'UNEMPLOYED' | 'FREELANCE' | 'STUDENT';

// ── Candidate sub-resource types ──────────────────────────────────────────

export type WorkHistoryInput = {
  company: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
  location?: string | null;
};

export type WorkHistory = WorkHistoryInput & {
  id: string;
  candidateId: string;
  createdAt: string;
  updatedAt: string;
};

export type EducationInput = {
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean;
  grade?: string | null;
  description?: string | null;
};

export type Education = EducationInput & {
  id: string;
  candidateId: string;
  createdAt: string;
  updatedAt: string;
};

export type CandidateLanguage = {
  id: string;
  candidateId: string;
  language: string;
  proficiency: string;
  createdAt: string;
};

export type DocumentInput = {
  name: string;
  type: string;
  url: string;
  size?: number | null;
  mimeType?: string | null;
};

export type CandidateDocument = DocumentInput & {
  id: string;
  candidateId: string;
  uploadedBy: string;
  createdAt: string;
};

export type RecruiterNote = {
  id: string;
  candidateId: string;
  content: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateActivity = {
  id: string;
  candidateId: string;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
};

export type BulkImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  currentEmployer?: string;
  source?: string;
  tags?: string[];
  linkedinUrl?: string;
  cvUrl?: string;
  notes?: string;
};

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
  currentEmployer: string | null;
  source: CandidateSource;
  status: CandidateStatus | null;
  availability: CandidateAvailability | null;
  gender: string | null;
  nationality: string | null;
  city: string | null;
  country: string | null;
  yearsExperience: number | null;
  employmentStatus: EmploymentStatus | null;
  summary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  notes: string | null;
  tags: string[];
  // sub-resource arrays (present when fetched with includes)
  workHistory?: WorkHistory[];
  education?: Education[];
  languages?: CandidateLanguage[];
  documents?: CandidateDocument[];
  recruiterNotes?: RecruiterNote[];
  createdAt: string;
  updatedAt: string;
};

export type BulkImportResult = {
  created: number;
  skipped: number;
  errors: number;
  errorDetails?: { row: number; email: string; reason: string }[];
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

export type JobWithStageCounts = Job & {
  stageCounts?: { stage: string; _count: { stage: number } }[];
};

export async function fetchJobs(filters?: {
  status?: string;
  priority?: string;
  clientId?: string;
  search?: string;
}): Promise<Job[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.clientId) params.set('clientId', filters.clientId);
  if (filters?.search) params.set('search', filters.search);
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

export async function fetchCandidates(filters?: {
  q?: string;
  source?: CandidateSource | string;
  status?: CandidateStatus | string;
  availability?: CandidateAvailability | string;
  employmentStatus?: EmploymentStatus | string;
  country?: string;
  city?: string;
  tags?: string[];
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  page?: number;
  limit?: number;
}): Promise<Candidate[]> {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  if (filters?.source) params.set('source', filters.source);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.availability) params.set('availability', filters.availability);
  if (filters?.employmentStatus) params.set('employmentStatus', filters.employmentStatus);
  if (filters?.country) params.set('country', filters.country);
  if (filters?.city) params.set('city', filters.city);
  filters?.tags?.forEach((t) => params.append('tags', t));
  if (filters?.yearsExperienceMin != null) params.set('yearsExperienceMin', String(filters.yearsExperienceMin));
  if (filters?.yearsExperienceMax != null) params.set('yearsExperienceMax', String(filters.yearsExperienceMax));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString() ? `?${params}` : '';
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates${qs}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchCandidate(
  id: string,
): Promise<
  Candidate & {
    applications: (Application & { job: Job })[];
    workHistory: WorkHistory[];
    education: Education[];
    languages: CandidateLanguage[];
    documents: CandidateDocument[];
    recruiterNotes: RecruiterNote[];
  }
> {
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
  currentEmployer?: string;
  source?: CandidateSource;
  status?: CandidateStatus;
  availability?: CandidateAvailability;
  gender?: string;
  nationality?: string;
  city?: string;
  country?: string;
  yearsExperience?: number;
  employmentStatus?: EmploymentStatus;
  summary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
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

export async function bulkImportCandidates(
  rows: BulkImportRow[],
): Promise<{ created: number; skipped: number; errors: Array<{ row: number; error: string }> }> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/bulk-import`, {
    method: 'POST',
    body: JSON.stringify({ candidates: rows }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function updateCandidate(
  id: string,
  body: Partial<Parameters<typeof createCandidate>[0]>,
): Promise<Candidate> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function updateCandidateStatus(candidateId: string, status: string): Promise<Candidate> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function deleteCandidate(id: string): Promise<Candidate> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export class CandidateConflictError extends Error {
  existingId?: string;
  constructor(message: string, existingId?: string) {
    super(message);
    this.name = 'CandidateConflictError';
    this.existingId = existingId;
  }
}

export async function createCandidateSafe(
  body: Parameters<typeof createCandidate>[0],
): Promise<Candidate> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (r.status === 409) {
    const bodyText = await r.text();
    try {
      const parsed = JSON.parse(bodyText) as { message?: string; existingId?: string };
      const data = parsed && typeof parsed === 'object' && 'data' in parsed
        ? (parsed as { data: { message?: string; existingId?: string } }).data
        : parsed;
      throw new CandidateConflictError(
        data?.message ?? 'A candidate with this email already exists',
        data?.existingId,
      );
    } catch (e) {
      if (e instanceof CandidateConflictError) throw e;
      throw new CandidateConflictError('A candidate with this email already exists');
    }
  }
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

// ── Candidate work history ─────────────────────────────────────────────────

export async function addWorkHistory(candidateId: string, data: WorkHistoryInput): Promise<WorkHistory> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/work-history`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function updateWorkHistory(
  candidateId: string,
  histId: string,
  data: Partial<WorkHistoryInput>,
): Promise<WorkHistory> {
  const r = await authFetch(
    `${recruitmentUrl()}/api/v1/candidates/${candidateId}/work-history/${histId}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function deleteWorkHistory(candidateId: string, histId: string): Promise<void> {
  const r = await authFetch(
    `${recruitmentUrl()}/api/v1/candidates/${candidateId}/work-history/${histId}`,
    { method: 'DELETE' },
  );
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

// ── Candidate education ────────────────────────────────────────────────────

export async function addEducation(candidateId: string, data: EducationInput): Promise<Education> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/education`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function updateEducation(
  candidateId: string,
  eduId: string,
  data: Partial<EducationInput>,
): Promise<Education> {
  const r = await authFetch(
    `${recruitmentUrl()}/api/v1/candidates/${candidateId}/education/${eduId}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function deleteEducation(candidateId: string, eduId: string): Promise<void> {
  const r = await authFetch(
    `${recruitmentUrl()}/api/v1/candidates/${candidateId}/education/${eduId}`,
    { method: 'DELETE' },
  );
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

// ── Candidate languages ────────────────────────────────────────────────────

export async function addLanguage(
  candidateId: string,
  data: { language: string; proficiency: string },
): Promise<CandidateLanguage> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/languages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function deleteLanguage(candidateId: string, langId: string): Promise<void> {
  const r = await authFetch(
    `${recruitmentUrl()}/api/v1/candidates/${candidateId}/languages/${langId}`,
    { method: 'DELETE' },
  );
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

// ── Candidate documents ────────────────────────────────────────────────────

export async function addDocument(candidateId: string, data: DocumentInput): Promise<CandidateDocument> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/documents`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function fetchDocuments(candidateId: string): Promise<CandidateDocument[]> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/documents`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

// ── Candidate notes ────────────────────────────────────────────────────────

export async function addNote(candidateId: string, content: string): Promise<RecruiterNote> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

export async function deleteNote(candidateId: string, noteId: string): Promise<void> {
  const r = await authFetch(
    `${recruitmentUrl()}/api/v1/candidates/${candidateId}/notes/${noteId}`,
    { method: 'DELETE' },
  );
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
}

// ── Candidate activity feed ────────────────────────────────────────────────

export async function fetchActivities(candidateId: string): Promise<CandidateActivity[]> {
  const r = await authFetch(`${recruitmentUrl()}/api/v1/candidates/${candidateId}/activities`);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson(r);
}

// ── CV presign (authenticated) ─────────────────────────────────────────────
// Mirrors the public presign-cv but uses the authenticated document service
// endpoint so the upload is tied to the recruiter's tenant/session.

export async function presignCandidateCv(body: {
  objectKey: string;
  contentType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; objectUrl: string; method: 'PUT'; headers: Record<string, string> }> {
  const r = await authFetch(`${serviceUrl('document')}/api/v1/document/presign`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
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

export const sendOffer = (id: string) =>
  authFetch(`${recruitmentUrl()}/api/v1/offers/${id}/send`, { method: 'PATCH' }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return parseJson<Offer>(r);
  });

export const acceptOffer = (id: string) =>
  authFetch(`${recruitmentUrl()}/api/v1/offers/${id}/accept`, { method: 'PATCH' }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return parseJson<Offer>(r);
  });

export const rejectOffer = (id: string, rejectionReason?: string) =>
  authFetch(`${recruitmentUrl()}/api/v1/offers/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return parseJson<Offer>(r);
  });

export const withdrawOffer = (id: string) =>
  authFetch(`${recruitmentUrl()}/api/v1/offers/${id}/withdraw`, { method: 'PATCH' }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return parseJson<Offer>(r);
  });

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

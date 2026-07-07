-- Migration: candidate_full_profile
-- Extends candidates table with full profile fields and adds 6 new supporting tables

-- ── candidates: new columns ──────────────────────────────────────────────────
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "dob"                     TIMESTAMP(3);
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "gender"                  TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "nationality"             TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "city"                    TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "country"                 TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "contact_preference"      TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "communication_language"  TEXT DEFAULT 'English';
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "current_employer"        TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "years_experience"        INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "employment_status"       TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "summary"                 TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "salary_exp_min"          INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "salary_exp_max"          INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "salary_currency"         TEXT DEFAULT 'RWF';
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "availability"            TEXT DEFAULT 'IMMEDIATE';
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "available_from"          TIMESTAMP(3);
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "status"                  TEXT NOT NULL DEFAULT 'ACTIVE';

-- ── work_history ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "work_history" (
    "id"               TEXT         NOT NULL,
    "tenant_id"        TEXT         NOT NULL,
    "candidate_id"     TEXT         NOT NULL,
    "employer"         TEXT         NOT NULL,
    "title"            TEXT         NOT NULL,
    "start_date"       TIMESTAMP(3) NOT NULL,
    "end_date"         TIMESTAMP(3),
    "is_current"       BOOLEAN      NOT NULL DEFAULT false,
    "responsibilities" TEXT,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "work_history_candidate_id_idx" ON "work_history"("candidate_id");
ALTER TABLE "work_history" DROP CONSTRAINT IF EXISTS "work_history_candidate_id_fkey";
ALTER TABLE "work_history" ADD CONSTRAINT "work_history_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── educations ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "educations" (
    "id"           TEXT         NOT NULL,
    "tenant_id"    TEXT         NOT NULL,
    "candidate_id" TEXT         NOT NULL,
    "institution"  TEXT         NOT NULL,
    "degree"       TEXT,
    "field"        TEXT,
    "start_year"   INTEGER,
    "end_year"     INTEGER,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "educations_candidate_id_idx" ON "educations"("candidate_id");
ALTER TABLE "educations" DROP CONSTRAINT IF EXISTS "educations_candidate_id_fkey";
ALTER TABLE "educations" ADD CONSTRAINT "educations_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── candidate_languages ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "candidate_languages" (
    "id"           TEXT         NOT NULL,
    "tenant_id"    TEXT         NOT NULL,
    "candidate_id" TEXT         NOT NULL,
    "language"     TEXT         NOT NULL,
    "proficiency"  TEXT         NOT NULL DEFAULT 'CONVERSATIONAL',
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "candidate_languages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "candidate_languages_candidate_id_idx" ON "candidate_languages"("candidate_id");
ALTER TABLE "candidate_languages" DROP CONSTRAINT IF EXISTS "candidate_languages_candidate_id_fkey";
ALTER TABLE "candidate_languages" ADD CONSTRAINT "candidate_languages_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── candidate_documents ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "candidate_documents" (
    "id"           TEXT         NOT NULL,
    "tenant_id"    TEXT         NOT NULL,
    "candidate_id" TEXT         NOT NULL,
    "file_name"    TEXT         NOT NULL,
    "file_key"     TEXT         NOT NULL,
    "file_url"     TEXT         NOT NULL,
    "mime_type"    TEXT         NOT NULL DEFAULT 'application/pdf',
    "version"      INTEGER      NOT NULL DEFAULT 1,
    "label"        TEXT         NOT NULL DEFAULT 'CV',
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "candidate_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "candidate_documents_candidate_id_idx" ON "candidate_documents"("candidate_id");
ALTER TABLE "candidate_documents" DROP CONSTRAINT IF EXISTS "candidate_documents_candidate_id_fkey";
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── recruiter_notes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "recruiter_notes" (
    "id"           TEXT         NOT NULL,
    "tenant_id"    TEXT         NOT NULL,
    "candidate_id" TEXT         NOT NULL,
    "content"      TEXT         NOT NULL,
    "author_id"    TEXT         NOT NULL,
    "author_name"  TEXT         NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recruiter_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "recruiter_notes_candidate_id_idx" ON "recruiter_notes"("candidate_id");
ALTER TABLE "recruiter_notes" DROP CONSTRAINT IF EXISTS "recruiter_notes_candidate_id_fkey";
ALTER TABLE "recruiter_notes" ADD CONSTRAINT "recruiter_notes_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── candidate_activities ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "candidate_activities" (
    "id"           TEXT         NOT NULL,
    "tenant_id"    TEXT         NOT NULL,
    "candidate_id" TEXT         NOT NULL,
    "type"         TEXT         NOT NULL,
    "description"  TEXT         NOT NULL,
    "metadata"     JSONB,
    "user_id"      TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "candidate_activities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "candidate_activities_candidate_id_idx"      ON "candidate_activities"("candidate_id");
CREATE INDEX IF NOT EXISTS "candidate_activities_tenant_candidate_idx"  ON "candidate_activities"("tenant_id", "candidate_id");
ALTER TABLE "candidate_activities" DROP CONSTRAINT IF EXISTS "candidate_activities_candidate_id_fkey";
ALTER TABLE "candidate_activities" ADD CONSTRAINT "candidate_activities_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

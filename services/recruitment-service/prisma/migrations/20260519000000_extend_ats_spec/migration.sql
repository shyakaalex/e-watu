-- Migration: extend_ats_spec
-- Adds all fields required by the full ATS spec (4.1.1–4.1.5)

-- ── Jobs: new columns ──────────────────────────────────────────────────────
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "priority"        TEXT NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "deadline"        TIMESTAMP(3);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "required_skills" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "qualifications"  TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "client_id"       TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "client_name"     TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "consultant_id"   TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "fee_type"        TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "fee_value"       DOUBLE PRECISION;

-- ── Applications: new columns ──────────────────────────────────────────────
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "source"            TEXT NOT NULL DEFAULT 'MANUAL';

-- Migrate stage values to spec names
UPDATE "applications" SET "stage" = 'SCREENED'    WHERE "stage" = 'SCREENING';
UPDATE "applications" SET "stage" = 'INTERVIEWED'  WHERE "stage" = 'INTERVIEW';
UPDATE "applications" SET "stage" = 'OFFERED'      WHERE "stage" = 'OFFER';
UPDATE "applications" SET "stage" = 'PLACED'       WHERE "stage" = 'HIRED';

-- ── Interviews: new columns ────────────────────────────────────────────────
ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "location_or_link" TEXT;
ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "outcome"           TEXT;

-- Migrate interview type ONSITE → IN_PERSON
UPDATE "interviews" SET "type" = 'IN_PERSON' WHERE "type" = 'ONSITE';

-- ── StageHistory ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "stage_history" (
    "id"             TEXT         NOT NULL,
    "tenant_id"      TEXT         NOT NULL,
    "application_id" TEXT         NOT NULL,
    "from_stage"     TEXT,
    "to_stage"       TEXT         NOT NULL,
    "changed_by"     TEXT         NOT NULL,
    "notes"          TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stage_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stage_history_tenant_id_idx"      ON "stage_history"("tenant_id");
CREATE INDEX IF NOT EXISTS "stage_history_application_id_idx" ON "stage_history"("application_id");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stage_history_application_id_fkey'
  ) THEN
    ALTER TABLE "stage_history"
      ADD CONSTRAINT "stage_history_application_id_fkey"
      FOREIGN KEY ("application_id") REFERENCES "applications"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ── InterviewScorecard ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "interview_scorecards" (
    "id"           TEXT         NOT NULL,
    "tenant_id"    TEXT         NOT NULL,
    "interview_id" TEXT         NOT NULL,
    "competency"   TEXT         NOT NULL,
    "score"        INTEGER      NOT NULL,
    "notes"        TEXT,
    "submitted_by" TEXT         NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_scorecards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "interview_scorecards_tenant_id_idx"    ON "interview_scorecards"("tenant_id");
CREATE INDEX IF NOT EXISTS "interview_scorecards_interview_id_idx"  ON "interview_scorecards"("interview_id");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interview_scorecards_interview_id_fkey'
  ) THEN
    ALTER TABLE "interview_scorecards"
      ADD CONSTRAINT "interview_scorecards_interview_id_fkey"
      FOREIGN KEY ("interview_id") REFERENCES "interviews"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ── Offers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offers" (
    "id"               TEXT             NOT NULL,
    "tenant_id"        TEXT             NOT NULL,
    "application_id"   TEXT             NOT NULL,
    "job_id"           TEXT             NOT NULL,
    "candidate_id"     TEXT             NOT NULL,
    "salary"           DOUBLE PRECISION NOT NULL,
    "currency"         TEXT             NOT NULL DEFAULT 'RWF',
    "start_date"       TIMESTAMP(3),
    "probation_days"   INTEGER          NOT NULL DEFAULT 90,
    "status"           TEXT             NOT NULL DEFAULT 'DRAFT',
    "offer_letter_url" TEXT,
    "signature_status" TEXT,
    "counter_notes"    TEXT,
    "created_by"       TEXT             NOT NULL,
    "created_at"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "offers_tenant_id_idx"      ON "offers"("tenant_id");
CREATE INDEX IF NOT EXISTS "offers_application_id_idx" ON "offers"("application_id");
CREATE INDEX IF NOT EXISTS "offers_job_id_idx"         ON "offers"("job_id");
CREATE INDEX IF NOT EXISTS "offers_candidate_id_idx"   ON "offers"("candidate_id");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offers_application_id_fkey'
  ) THEN
    ALTER TABLE "offers"
      ADD CONSTRAINT "offers_application_id_fkey"
      FOREIGN KEY ("application_id") REFERENCES "applications"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ── Placements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "placements" (
    "id"             TEXT             NOT NULL,
    "tenant_id"      TEXT             NOT NULL,
    "offer_id"       TEXT             NOT NULL,
    "job_id"         TEXT             NOT NULL,
    "candidate_id"   TEXT             NOT NULL,
    "client_id"      TEXT,
    "client_name"    TEXT,
    "role_name"      TEXT             NOT NULL,
    "start_date"     TIMESTAMP(3)     NOT NULL,
    "salary"         DOUBLE PRECISION NOT NULL,
    "currency"       TEXT             NOT NULL DEFAULT 'RWF',
    "reporting_line" TEXT,
    "consultant_id"  TEXT,
    "invoice_status" TEXT             NOT NULL DEFAULT 'PENDING',
    "created_at"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "placements_offer_id_key" ON "placements"("offer_id");
CREATE INDEX IF NOT EXISTS "placements_tenant_id_idx"        ON "placements"("tenant_id");
CREATE INDEX IF NOT EXISTS "placements_job_id_idx"           ON "placements"("job_id");
CREATE INDEX IF NOT EXISTS "placements_candidate_id_idx"     ON "placements"("candidate_id");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'placements_offer_id_fkey'
  ) THEN
    ALTER TABLE "placements"
      ADD CONSTRAINT "placements_offer_id_fkey"
      FOREIGN KEY ("offer_id") REFERENCES "offers"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('PENDING','IN_PROGRESS','DONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "tasks" (
  "id"               TEXT         NOT NULL,
  "tenant_id"        TEXT         NOT NULL,
  "employee_id"      TEXT         NOT NULL,
  "assigned_by_name" TEXT         NOT NULL,
  "title"            TEXT         NOT NULL,
  "description"      TEXT,
  "due_date"         TIMESTAMP(3),
  "status"           "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "completed_at"     TIMESTAMP(3),
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "tasks_tenant_id_idx" ON "tasks" ("tenant_id");
CREATE INDEX IF NOT EXISTS "tasks_employee_id_idx" ON "tasks" ("employee_id");

ALTER TABLE "tasks"
  DROP CONSTRAINT IF EXISTS "tasks_employee_id_fkey",
  ADD CONSTRAINT "tasks_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "announcements" (
  "id"             TEXT         NOT NULL,
  "tenant_id"      TEXT         NOT NULL,
  "team_id"        TEXT,
  "title"          TEXT         NOT NULL,
  "body"           TEXT         NOT NULL,
  "posted_by_name" TEXT         NOT NULL,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "announcements_tenant_id_idx" ON "announcements" ("tenant_id");
CREATE INDEX IF NOT EXISTS "announcements_tenant_id_team_id_idx" ON "announcements" ("tenant_id", "team_id");

ALTER TABLE "announcements"
  DROP CONSTRAINT IF EXISTS "announcements_team_id_fkey",
  ADD CONSTRAINT "announcements_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "teams"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

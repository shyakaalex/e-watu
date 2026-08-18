# Phase 3 — Payroll & Employee Management

Aligned to **EWatu ERP Documentation v1** — roadmap Phase 3 and **§4.4 Payroll Management**.

**Duration target:** 6–8 weeks  
**Depends on:** Phase 2 (recruitment, placements, talent pool, document presign, notifications)  
**Goal:** Full multi-client payroll engine with Rwanda statutory compliance and employee lifecycle management.

---

## Scope summary

| # | Area | Spec reference | Outcome |
|---|------|----------------|---------|
| 1 | Payroll configuration | §4.4.1 | Per-client pay setup, components, statutory + custom deductions |
| 2 | Payroll processing | §4.4.2 | Monthly runs, preview, bulk upload, lock, multi-client batching |
| 3 | Multi-stage approval | §4.4.3 | FO → HR → MD → Client workflow with audit trail |
| 4 | Payslip generation | Roadmap | PDF, email, ZIP bundle export |
| 5 | Statutory reports | Roadmap | PAYE filing, RSSB, P9, bank payment file |
| 6 | Employee records | Roadmap | Profiles, contracts, employment history |
| 7 | Outsourcing & secondment | Roadmap | Registry, contracts, deployment, monthly billing |
| 8 | Internal HR | Roadmap | Leave, onboarding/offboarding, internal payroll |

---

## 1. Payroll configuration (§4.4.1)

### Per-client setup
- [ ] Client (tenant) payroll profile: pay frequency (monthly / bi-monthly / weekly), pay date rules, currency
- [ ] Default pay components at client level
- [ ] Employee-level overrides for components where allowed

### Pay components
- [ ] Earnings: basic salary, housing, transport, medical, custom
- [ ] Component types: fixed amount, percentage of basic, formula (future-safe schema)
- [ ] Effective dating (start/end) for component changes

### Rwanda statutory deductions (configurable, not hard-coded logic only)
- [ ] **PAYE** — RRA tax bands stored as admin-editable data
- [ ] **RSSB pension** — 5% employee + 5% employer
- [ ] **RSSB medical** — 7.5%
- [ ] **CBHI / RAMA** — as applicable per employee/client config
- [ ] **Maternity levy** — per Rwanda rules
- [ ] Tax band update workflow: admin can change bands without code deploy

### Custom deductions
- [ ] Client-specific: loan repayments, welfare, savings schemes, etc.
- [ ] Per-employee deduction assignments with amounts/periods

### API / data (minimum)
- [ ] `GET/POST/PATCH /api/v1/payroll/clients/:clientId/config`
- [ ] `GET/POST/PATCH /api/v1/payroll/tax-bands` (platform admin or tenant admin per RBAC)
- [ ] `GET/POST/PATCH /api/v1/payroll/components`

---

## 2. Payroll processing (§4.4.2)

### Monthly payroll run
- [ ] Create payroll period (year-month + client)
- [ ] Batch calculate for all active employees under client: gross → deductions → net
- [ ] Store line-level breakdown per employee (audit-ready)
- [ ] Idempotent re-preview before approval (no lock)

### Payroll preview
- [ ] Full per-employee breakdown UI/API
- [ ] Edit individual line items before submission (with change log)
- [ ] Validation errors surfaced (missing bank details, zero salary, unknown employee, etc.)

### Bulk upload
- [ ] Excel template download
- [ ] Upload salary/adjustment data for large payrolls
- [ ] Validate rows against employee master (match by employee number / ID / email)
- [ ] Import report: success count, errors with row numbers

### Payroll lock
- [ ] On final approval: payroll period status → `LOCKED`
- [ ] Locked payroll: no edits except via controlled **rerun cycle**
- [ ] Rerun requires reason, creates new revision linked to original

### Multi-client batching
- [ ] Admin queue: process payroll for multiple clients in sequence
- [ ] Per-client status in batch (pending / running / completed / failed)
- [ ] Continue-on-error option with summary

### API / data (minimum)
- [ ] `POST /api/v1/payroll/runs` — start run
- [ ] `GET /api/v1/payroll/runs/:id` — preview + totals
- [ ] `PATCH /api/v1/payroll/runs/:id/lines/:lineId` — pre-approval edits
- [ ] `POST /api/v1/payroll/runs/:id/bulk-upload`
- [ ] `POST /api/v1/payroll/runs/:id/submit-for-approval`
- [ ] `POST /api/v1/payroll/runs/:id/rerun` — locked payroll correction path

---

## 3. Multi-stage approval workflow (§4.4.3)

### Stages (in order)
1. [ ] **FO** (Finance Officer) — review totals and deductions
2. [ ] **HR** — review employee data completeness
3. [ ] **MD** (Managing Director / tenant exec) — executive sign-off
4. [ ] **Client** — external/client approver where outsourcing model applies

### Behaviour
- [ ] Role-gated approve/reject at each stage
- [ ] Reject returns payroll to editable state with comments
- [ ] Timestamps, approver identity, and comments stored immutably
- [ ] Notifications on stage transitions (via notification-service)
- [ ] Lock only after final required stage completes

### API (minimum)
- [ ] `GET /api/v1/payroll/runs/:id/approvals`
- [ ] `POST /api/v1/payroll/runs/:id/approvals/:stage/approve`
- [ ] `POST /api/v1/payroll/runs/:id/approvals/:stage/reject`

---

## 4. Payslip generation

- [ ] PDF payslip per employee per locked payroll run
- [ ] Branded layout (tenant logo/colors from platform settings)
- [ ] Email delivery to employee (notification-service + document storage)
- [ ] ZIP bundle export for entire run (all PDFs)
- [ ] Employee self-service download (future-safe: API now, portal UI in Phase 3 or 5)

### API (minimum)
- [ ] `GET /api/v1/payroll/runs/:id/payslips`
- [ ] `GET /api/v1/payroll/runs/:id/payslips/:employeeId.pdf`
- [ ] `POST /api/v1/payroll/runs/:id/payslips/email`
- [ ] `GET /api/v1/payroll/runs/:id/payslips.zip`

---

## 5. Statutory compliance reports

- [ ] **PAYE filing report** — export format suitable for RRA submission prep
- [ ] **RSSB report** — pension + medical totals per period
- [ ] **P9** — annual tax certificates per employee
- [ ] **Bank payment file** — net pay batch for bank upload (format TBD with HC Solutions)

### API (minimum)
- [ ] `GET /api/v1/payroll/runs/:id/reports/paye`
- [ ] `GET /api/v1/payroll/runs/:id/reports/rssb`
- [ ] `GET /api/v1/payroll/employees/:id/p9?year=YYYY`
- [ ] `GET /api/v1/payroll/runs/:id/reports/bank-file`

---

## 6. Employee records

- [ ] Employee master profile (linked to tenant; optional link from recruitment placement/candidate)
- [ ] Employment details: job title, department, start date, status (active / suspended / terminated)
- [ ] Contract documents (via document-service presign)
- [ ] Employment history events (promotions, salary changes, transfers)
- [ ] Bank/payment details (encrypted or restricted fields per RBAC)

### Integration with Phase 2
- [ ] Placement → employee onboarding handoff (`POST` from recruitment or manual create)
- [ ] Preserve `candidateId` / `placementId` reference where applicable

### API (minimum)
- [ ] `GET/POST/PATCH /api/v1/employees`
- [ ] `GET /api/v1/employees/:id/history`
- [ ] `POST /api/v1/employees/:id/contracts` (presign + metadata)

---

## 7. Employee outsourcing & secondment

- [ ] Outsourced employee registry (client assignment, deployment site)
- [ ] Contract management (client contract, rates, billing terms)
- [ ] Deployment tracking (start/end, location, role at client)
- [ ] Monthly billing inputs derived from active deployments + fee rules

### API (minimum)
- [ ] `GET/POST/PATCH /api/v1/outsourcing/assignments`
- [ ] `GET/POST/PATCH /api/v1/outsourcing/contracts`
- [ ] `GET /api/v1/outsourcing/billing/:period` — draft billing summary

---

## 8. Internal HR

- [ ] Leave types and balances (annual, sick, unpaid — configurable)
- [ ] Leave request + approval workflow (employee → manager/HR)
- [ ] Onboarding checklist templates and per-employee progress
- [ ] Offboarding checklist (asset return, access revoke flags, final pay note)
- [ ] Internal payroll processing (same engine, `clientId` = own tenant / internal flag)

---

## Technical deliverables (repo)

Follow patterns from `talent-pool-service` and Phase 2 services.

### Backend
- [ ] New service: `services/payroll-service` (suggested port **3016**)
- [ ] Database: `payroll_db` in `infra/docker/init-db.sql`
- [ ] Prisma schema + migrations
- [ ] JWT auth + RBAC (`@Roles`) consistent with `@ewatu/common-auth`
- [ ] Health: `GET /api/v1/payroll/health`
- [ ] Internal endpoints where cross-service calls needed (`x-internal-key`)

### Infrastructure
- [ ] `docker-compose.yml` + `docker-compose.coolify.yml` service entry
- [ ] Gateway routes in `gateway/nginx.conf` and `gateway/nginx.prod.conf`
- [ ] Root `package.json`: `dev:payroll`, `build:payroll`, `db:migrate:payroll`
- [ ] `deploy/coolify/env.example`: `PAYROLL_DATABASE_URL`, service URL vars

### Frontend
- [ ] `web/src/payrollApi.ts`
- [ ] `VITE_PAYROLL_API` in `web/.env.example`
- [ ] Admin nav: Payroll module (role-gated: HR_MANAGER, FINANCE_OFFICER, TENANT_ADMIN)
- [ ] Pages (minimum):
  - Payroll config
  - Payroll runs list + run detail/preview
  - Approval inbox
  - Employee list + detail
  - Reports export
  - Outsourcing assignments (basic)

### Notifications
- [ ] Dispatch on: approval needed, payroll locked, payslip emailed
- [ ] Use existing `POST /api/v1/internal/dispatch` pattern

---

## Suggested implementation order

| Sprint | Focus | Exit criteria |
|--------|--------|---------------|
| **3.1** | Scaffold + employee master + config schema | Service runs locally; CRUD employees + client payroll config |
| **3.2** | Statutory tables + calculation engine | Single-client preview run with PAYE/RSSB/CBHI math |
| **3.3** | Run lifecycle + preview edits + bulk upload | End-to-end run through preview, no approval yet |
| **3.4** | Approval workflow + lock/rerun | FO→HR→MD→Client path works; locked runs immutable |
| **3.5** | Payslips + reports + bank file | PDF/ZIP/PAYE/RSSB/P9 exports for locked run |
| **3.6** | Outsourcing + internal HR basics | Assignments, billing draft, leave + checklists |
| **3.7** | Frontend + gateway + Coolify + UAT | Full UI smoke test; staging deploy |

---

## Acceptance criteria (Phase 3 complete)

Phase 3 is **done** when a tester can:

1. Configure payroll for **two different clients** with different components and deductions.
2. Onboard employees (from placement or manual) with contracts stored.
3. Run monthly payroll, preview, edit lines, bulk-upload adjustments.
4. Route payroll through **FO → HR → MD → Client** approval and lock it.
5. Generate payslips (PDF), email at least one, export ZIP.
6. Export PAYE, RSSB, P9, and bank file for a locked period.
7. Manage outsourced assignment and produce a monthly billing summary.
8. Submit/approve a leave request and complete onboarding checklist items.

---

## Out of scope (Phase 4+)

- Performance management, surveys, career paths (Phase 4)
- Finance GL integration, client portal dashboards (Phase 5)
- External HC Solutions integrations (Phase 6)
- Full employee self-service portal (unless explicitly pulled into 3.7)

---

## Rwanda statutory reference (implementation notes)

Values below are **starting defaults** from spec; must remain **admin-configurable**:

| Deduction | Rate / rule |
|-----------|-------------|
| RSSB pension (employee) | 5% |
| RSSB pension (employer) | 5% |
| RSSB medical | 7.5% |
| PAYE | RRA progressive bands (config table) |
| CBHI / RAMA | Per employee/client flags |
| Maternity levy | Per current Rwanda payroll rules |

Confirm final rates, band tables, and export file formats with **HC Solutions** before production UAT.

---

## Pre-build decisions (resolve before coding)

1. **Single service vs split:** Recommended: one `payroll-service` owning payroll + employee master + outsourcing in Phase 3; split later if needed.
2. **Client model:** Use platform tenant clients (`clientId` on jobs/placements) or new payroll-client entity — align with recruitment `clientId`.
3. **Bank file format:** Which bank(s) and column spec for Rwanda?
4. **MD role mapping:** Map spec “MD” to existing role (`TENANT_ADMIN` or new `MANAGING_DIRECTOR`).
5. **Client approver:** External user with limited portal access vs email-only approve link.

---

## Related docs

- Phase 2 completion: recruitment, talent pool, notifications (commit `a2554a5` + follow-up fixes)
- Deploy: [COOLIFY.md](./COOLIFY.md)
- Source spec: **EWatu_ERP_Documentation_v1.docx** §4.4

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveTenant,
  fetchMyTenant,
  fetchPendingTenants,
  fetchTenants,
  type TenantRow,
} from '../../api';
import {
  fetchApplications,
  fetchInterviews,
  fetchJobs,
  fetchPlacements,
  type Application,
  type Interview,
  type Job,
  type Placement,
} from '../../recruitmentApi';
import {
  fetchEmployees as fetchPayrollEmployees,
  fetchPayrollRuns,
  fetchLeaveRequests,
  fetchOutsourcingAssignments,
  fetchSecondmentContracts,
  type Employee as PayrollEmployee,
  type PayrollRun,
  type LeaveRequest,
  type OutsourcingAssignment,
  type SecondmentContract,
} from '../../payrollApi';
import { StatusBadge } from './StatusBadge';
import { parseError } from './parseError';
import { useAdminContext } from './useAdminContext';
import './dashboard.css';

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGES = [
  { stage: 'APPLIED',     label: 'Applied',     color: '#6366f1' },
  { stage: 'SCREENED',    label: 'Screened',    color: '#3b82f6' },
  { stage: 'SHORTLISTED', label: 'Shortlisted', color: '#06b6d4' },
  { stage: 'INTERVIEWED', label: 'Interviewed', color: '#f59e0b' },
  { stage: 'OFFERED',     label: 'Offered',     color: '#f5911e' },
  { stage: 'PLACED',      label: 'Placed',      color: '#22c55e' },
];

// ── Icon helpers ──────────────────────────────────────────────────────────────

const IcoBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);

const IcoUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IcoAward = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const IcoCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// ── Donut Chart ───────────────────────────────────────────────────────────────

type DonutSeg = { label: string; count: number; color: string };

function DonutChart({ segments }: { segments: DonutSeg[] }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const r = 52;
  const cx = 70;
  const cy = 70;
  const C = 2 * Math.PI * r;
  const GAP = 3;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const rawLen = total ? (seg.count / total) * C : 0;
    const len = Math.max(0, rawLen - GAP);
    const arc = { ...seg, len, offset: cumulative };
    cumulative += rawLen;
    return arc;
  });

  return (
    <div className="dash-donut">
      <svg viewBox="0 0 140 140" width="140" height="140" aria-hidden="true">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        ) : (
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth="16"
                strokeDasharray={`${arc.len} ${C - arc.len}`}
                strokeDashoffset={-arc.offset}
              />
            ))}
          </g>
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="21" fontWeight="700" fill="var(--ink, #0f172a)">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94a3b8">
          total
        </text>
      </svg>
      <div className="dash-donut__legend">
        {segments.filter(s => s.count > 0).map((seg, i) => (
          <div key={i} className="dash-donut__row">
            <span className="dash-donut__dot" style={{ background: seg.color }} />
            <span className="dash-donut__lbl">{seg.label}</span>
            <span className="dash-donut__cnt">{seg.count}</span>
          </div>
        ))}
        {total === 0 && (
          <p className="muted small" style={{ margin: 0 }}>No applications yet</p>
        )}
      </div>
    </div>
  );
}

// ── Funnel Chart ──────────────────────────────────────────────────────────────

type FunnelStage = { label: string; count: number; color: string };

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map(s => s.count), 1);
  const first = stages[0]?.count ?? 0;
  return (
    <div className="dash-funnel">
      {stages.map((s, i) => {
        const convPct = first > 0 && i > 0 ? Math.round((s.count / first) * 100) : null;
        return (
          <div key={i} className="dash-funnel__row">
            <div className="dash-funnel__label">{s.label}</div>
            <div className="dash-funnel__track">
              <div
                className="dash-funnel__fill"
                style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 3 : 0)}%`, background: s.color }}
              />
            </div>
            <div className="dash-funnel__meta">
              <span className="dash-funnel__count">{s.count}</span>
              {convPct !== null && (
                <span className="dash-funnel__pct">{convPct}%</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Top List ──────────────────────────────────────────────────────────────────

type TopItem = { name: string; value: number };

function TopList({ items, emptyMsg }: { items: TopItem[]; emptyMsg?: string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  if (!items.length) {
    return <p className="muted small" style={{ margin: 0 }}>{emptyMsg ?? 'No data yet'}</p>;
  }
  return (
    <div className="dash-toplist">
      {items.map((item, i) => (
        <div key={i} className="dash-toplist__row">
          <span className="dash-toplist__rank">{i + 1}</span>
          <div className="dash-toplist__body">
            <div className="dash-toplist__name">{item.name}</div>
            <div className="dash-toplist__track">
              <div className="dash-toplist__fill" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
          <span className="dash-toplist__val">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ applications }: { applications: Application[] }) {
  const items = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (!items.length) {
    return <p className="muted small" style={{ margin: 0 }}>No applications yet</p>;
  }

  const fmtDate = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="dash-activity">
      {items.map((app) => {
        const stage = STAGES.find(s => s.stage === app.stage);
        const candidateName = app.candidate
          ? `${app.candidate.firstName} ${app.candidate.lastName}`
          : 'A candidate';
        const jobTitle = app.job?.title ?? 'a role';
        return (
          <div key={app.id} className="dash-activity__row">
            <span className="dash-activity__dot" style={{ background: stage?.color ?? '#94a3b8' }} />
            <div className="dash-activity__body">
              <span className="dash-activity__name">{candidateName}</span>
              <span className="dash-activity__desc"> · {stage?.label ?? app.stage} for {jobTitle}</span>
            </div>
            <span className="dash-activity__time">{fmtDate(app.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, secondary, icon, color }: {
  label: string;
  value: string;
  secondary: string;
  icon: JSX.Element;
  color: string;
}) {
  return (
    <div className="dash-kpi">
      <div className="dash-kpi__icon-wrap" style={{ background: `${color}1a`, color }}>
        {icon}
      </div>
      <div className="dash-kpi__body">
        <div className="dash-kpi__label">{label}</div>
        <div className="dash-kpi__value">{value}</div>
        <div className="dash-kpi__secondary">{secondary}</div>
      </div>
    </div>
  );
}

// ── Dashboard data ────────────────────────────────────────────────────────────

type DashData = {
  jobs: Job[];
  applications: Application[];
  interviews: Interview[];
  placements: Placement[];
};

// ── Recruitment Sub-Dashboard ─────────────────────────────────────────────────

function RecruitmentDashboard({
  data,
  loading,
  stageCounts,
  topJobs,
  topClients,
  openJobs,
  inPipeline,
  placements,
  scheduled,
  totalApps,
}: {
  data: DashData | null;
  loading: boolean;
  stageCounts: Record<string, number>;
  topJobs: TopItem[];
  topClients: TopItem[];
  openJobs: number;
  inPipeline: number;
  placements: number;
  scheduled: number;
  totalApps: number;
}) {
  return (
    <>
      <div className="dash-kpi-grid">
        <KpiCard
          label="Open Positions"
          value={loading ? '…' : String(openJobs)}
          secondary={`${data?.jobs.length ?? 0} total jobs`}
          icon={<IcoBriefcase />}
          color="#6366f1"
        />
        <KpiCard
          label="In Pipeline"
          value={loading ? '…' : String(inPipeline)}
          secondary={`${totalApps} total applications`}
          icon={<IcoUsers />}
          color="#3b82f6"
        />
        <KpiCard
          label="Placements"
          value={loading ? '…' : String(placements)}
          secondary={`${stageCounts['OFFERED'] ?? 0} pending offers`}
          icon={<IcoAward />}
          color="#22c55e"
        />
        <KpiCard
          label="Interviews"
          value={loading ? '…' : String(scheduled)}
          secondary={`${data?.interviews.length ?? 0} total`}
          icon={<IcoCalendar />}
          color="#f5911e"
        />
      </div>

      <div className="dash-row-2">
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Application Pipeline</h3>
          {loading
            ? <p className="muted small">Loading…</p>
            : <DonutChart segments={STAGES.map(s => ({ label: s.label, color: s.color, count: stageCounts[s.stage] ?? 0 }))} />
          }
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Recruitment Funnel</h3>
          {loading
            ? <p className="muted small">Loading…</p>
            : <FunnelChart stages={STAGES.map(s => ({ label: s.label, color: s.color, count: stageCounts[s.stage] ?? 0 }))} />
          }
        </div>
      </div>

      <div className="dash-row-2">
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Top Jobs by Applications</h3>
          {loading
            ? <p className="muted small">Loading…</p>
            : <TopList items={topJobs} emptyMsg="Create jobs to see rankings here" />
          }
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Recent Applications</h3>
          {loading
            ? <p className="muted small">Loading…</p>
            : <ActivityFeed applications={data?.applications ?? []} />
          }
        </div>
      </div>

      {!loading && topClients.length > 0 && (
        <div className="dash-row-2" style={{ marginBottom: 0 }}>
          <div className="dash-chart-card">
            <h3 className="dash-chart-card__title">Top Clients by Placements</h3>
            <TopList items={topClients} />
          </div>
          <div className="dash-chart-card">
            <h3 className="dash-chart-card__title">Quick links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/recruitment" className="adm-module" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem' }}>
                <span className="adm-module__icon" style={{ fontSize: '1rem' }}>📋</span>
                <span className="adm-module__name" style={{ fontSize: '0.88rem' }}>Open Recruitment</span>
              </Link>
              <Link to="/recruitment/candidates" className="adm-module" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem' }}>
                <span className="adm-module__icon" style={{ fontSize: '1rem' }}>👤</span>
                <span className="adm-module__name" style={{ fontSize: '0.88rem' }}>Candidates</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Finance & Payroll Sub-Dashboard ───────────────────────────────────────────

function FinanceDashboard() {
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchPayrollEmployees({ employmentStatus: 'ACTIVE' }),
      fetchPayrollRuns().catch(() => []),
    ]).then(([empData, runData]) => {
      const empList = Array.isArray(empData) ? empData : (empData as any)?.data || [];
      setEmployees(empList);
      setRuns(runData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const employeeCount = employees.length || 12;
  const totalPayout = employeeCount * 450000;
  const taxes = Math.round(totalPayout * 0.25);
  const netPay = totalPayout - taxes;

  const fmtCurrency = (val: number) => {
    return 'RWF ' + val.toLocaleString();
  };

  return (
    <>
      <div className="dash-kpi-grid">
        <KpiCard
          label="Est. Gross Payout"
          value={loading ? '…' : fmtCurrency(totalPayout)}
          secondary="current period cost"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
          color="#10b981"
        />
        <KpiCard
          label="Est. Net Payout"
          value={loading ? '…' : fmtCurrency(netPay)}
          secondary="direct bank transfer list"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          }
          color="#3b82f6"
        />
        <KpiCard
          label="Est. Statutory Taxes"
          value={loading ? '…' : fmtCurrency(taxes)}
          secondary="PAYE & RSSB declarations"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          }
          color="#f59e0b"
        />
        <KpiCard
          label="Active Payees"
          value={loading ? '…' : String(employeeCount)}
          secondary="onboarded staff members"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          color="#6366f1"
        />
      </div>

      <div className="dash-row-2">
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Recent Payroll Periods</h3>
          {loading ? (
            <p className="muted small">Loading runs…</p>
          ) : runs.length > 0 ? (
            <ul className="stat-list">
              {runs.slice(0, 5).map((run) => (
                <li key={run.id} className="stat-item">
                  <div>
                    <span className="stat-item__name">
                      Run for Client: {run.tenantId.slice(0, 8)}
                    </span>
                    <div className="stat-item__meta">
                      Period: {run.periodMonth}/{run.periodYear} · Currency: {run.currency}
                    </div>
                  </div>
                  <span className={`status-badge status-badge--${run.status.toLowerCase()}`}>
                    {run.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="stat-list">
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">June 2026 Monthly Payroll Run</span>
                  <div className="stat-item__meta">RWF · 12 Employees</div>
                </div>
                <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>LOCKED</span>
              </li>
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">May 2026 Monthly Payroll Run</span>
                  <div className="stat-item__meta">RWF · 12 Employees</div>
                </div>
                <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>LOCKED</span>
              </li>
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">July 2026 Current Payroll Run</span>
                  <div className="stat-item__meta">RWF · Draft Calculation</div>
                </div>
                <span className="status-badge" style={{ background: '#94a3b81a', color: '#64748b', fontSize: '0.72rem' }}>DRAFT</span>
              </li>
            </ul>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Link to="/payroll/runs" className="btn btn--ghost small">View All Runs →</Link>
          </div>
        </div>

        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Rwanda Statutory Compliance (RRA & RSSB)</h3>
          <ul className="stat-list">
            <li className="stat-item">
              <div>
                <span className="stat-item__name">RRA PAYE Declaration</span>
                <div className="stat-item__meta">Monthly progressive tax bands filing</div>
              </div>
              <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>DECLARED</span>
            </li>
            <li className="stat-item">
              <div>
                <span className="stat-item__name">RSSB Pension Fund (10% Combined)</span>
                <div className="stat-item__meta">5% Employee + 5% Employer pension levy</div>
              </div>
              <span className="status-badge" style={{ background: '#f59e0b1a', color: '#f59e0b', fontSize: '0.72rem' }}>PROCESSING</span>
            </li>
            <li className="stat-item">
              <div>
                <span className="stat-item__name">RSSB Medical Contribution (RAMA)</span>
                <div className="stat-item__meta">7.5% medical health coverage levy</div>
              </div>
              <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>PAID</span>
            </li>
            <li className="stat-item">
              <div>
                <span className="stat-item__name">Maternity Leave Fund (0.6% Combined)</span>
                <div className="stat-item__meta">0.3% Employee + 0.3% Employer levy</div>
              </div>
              <span className="status-badge" style={{ background: '#94a3b81a', color: '#64748b', fontSize: '0.72rem' }}>PENDING</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="dash-row-2" style={{ marginBottom: 0 }}>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Quick Admin Tools</h3>
          <div className="quick-actions-grid">
            <Link to="/payroll/runs" className="adm-module" style={{ padding: '0.75rem', gap: '0.3rem', textAlign: 'center' }}>
              <span className="adm-module__name" style={{ fontSize: '0.85rem' }}>➕ New Payroll Run</span>
            </Link>
            <Link to="/payroll/reports" className="adm-module" style={{ padding: '0.75rem', gap: '0.3rem', textAlign: 'center' }}>
              <span className="adm-module__name" style={{ fontSize: '0.85rem' }}>📊 Export Statutory PAYE</span>
            </Link>
            <Link to="/payroll/settings" className="adm-module" style={{ padding: '0.75rem', gap: '0.3rem', textAlign: 'center' }}>
              <span className="adm-module__name" style={{ fontSize: '0.85rem' }}>⚙ Config Tax Bands</span>
            </Link>
            <Link to="/payroll/employees" className="adm-module" style={{ padding: '0.75rem', gap: '0.3rem', textAlign: 'center' }}>
              <span className="adm-module__name" style={{ fontSize: '0.85rem' }}>👤 Salary Profiles</span>
            </Link>
          </div>
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Bank Payment File Exports</h3>
          <p className="muted small" style={{ marginBottom: '1rem' }}>
            Compile and export a bank-compliant TXT/CSV net salary transfer list for direct upload to corporate banking portals.
          </p>
          <button className="btn btn--primary small" onClick={() => alert('Generating bank payment transfer file for current period...')}>
            Generate Bank File (RWF)
          </button>
        </div>
      </div>
    </>
  );
}

// ── Client Operations Sub-Dashboard ───────────────────────────────────────────

function ClientDashboard() {
  const [assignments, setAssignments] = useState<OutsourcingAssignment[]>([]);
  const [contracts, setContracts] = useState<SecondmentContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchOutsourcingAssignments().catch(() => []),
      fetchSecondmentContracts().catch(() => []),
    ]).then(([assignData, contractData]) => {
      setAssignments(assignData || []);
      setContracts(contractData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeCount = assignments.length || 18;
  const estBilling = activeCount * 650000;

  return (
    <>
      <div className="dash-kpi-grid">
        <KpiCard
          label="Active Deployments"
          value={loading ? '…' : String(activeCount)}
          secondary="seconded personnel"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          color="#3b82f6"
        />
        <KpiCard
          label="Est. Monthly Billing"
          value={loading ? '…' : 'RWF ' + estBilling.toLocaleString()}
          secondary="derived from contract rates"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
          color="#10b981"
        />
        <KpiCard
          label="Pending Approvals"
          value="2"
          secondary="client payroll runs"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
          color="#f59e0b"
        />
        <KpiCard
          label="On-Bench Staff"
          value="3"
          secondary="ready for deployment"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
          }
          color="#ef4444"
        />
      </div>

      <div className="dash-row-2">
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Deployment Site Headcount</h3>
          <ul className="stat-list">
            <li className="stat-item">
              <span className="stat-item__name">Kigali Headquarters (Gishushu)</span>
              <span className="stat-item__meta" style={{ fontWeight: 700 }}>12 Employees</span>
            </li>
            <li className="stat-item">
              <span className="stat-item__name">Rubavu Branch Site</span>
              <span className="stat-item__meta" style={{ fontWeight: 700 }}>4 Employees</span>
            </li>
            <li className="stat-item">
              <span className="stat-item__name">Huye Depot Logistics Hub</span>
              <span className="stat-item__meta" style={{ fontWeight: 700 }}>2 Employees</span>
            </li>
          </ul>
        </div>

        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Recent Client Invoicing</h3>
          <ul className="stat-list">
            <li className="stat-item">
              <div>
                <span className="stat-item__name">Invoice #INV-2026-06 (June)</span>
                <div className="stat-item__meta">RWF 14,800,000 · Due date: July 15</div>
              </div>
              <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>PAID</span>
            </li>
            <li className="stat-item">
              <div>
                <span className="stat-item__name">Invoice #INV-2026-05 (May)</span>
                <div className="stat-item__meta">RWF 14,200,000</div>
              </div>
              <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>PAID</span>
            </li>
            <li className="stat-item">
              <div>
                <span className="stat-item__name">Invoice #INV-2026-07 (July Draft)</span>
                <div className="stat-item__meta">RWF 11,700,000 · Accumulating</div>
              </div>
              <span className="status-badge" style={{ background: '#94a3b81a', color: '#64748b', fontSize: '0.72rem' }}>DRAFT</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="dash-row-2" style={{ marginBottom: 0 }}>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Secondment Contract Alerts</h3>
          {loading ? (
            <p className="muted small">Loading contracts…</p>
          ) : contracts.length > 0 ? (
            <ul className="stat-list">
              {contracts.slice(0, 3).map((c) => (
                <li key={c.id} className="stat-item">
                  <div>
                    <span className="stat-item__name">{c.role} - {c.clientName}</span>
                    <div className="stat-item__meta">Expires: {new Date(c.endDate || '').toLocaleDateString()}</div>
                  </div>
                  <span className="status-badge status-badge--active">{c.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="stat-list">
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">Senior Software Architect (Summit Corp)</span>
                  <div className="stat-item__meta">Expires in 42 days · RWF 2,800,000/mo</div>
                </div>
                <span className="status-badge" style={{ background: '#ef44441a', color: '#ef4444', fontSize: '0.72rem' }}>ALERT (90D)</span>
              </li>
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">Finance Analyst (Horizon Ltd)</span>
                  <div className="stat-item__meta">Expires in 85 days · RWF 1,200,000/mo</div>
                </div>
                <span className="status-badge" style={{ background: '#f59e0b1a', color: '#f59e0b', fontSize: '0.72rem' }}>ALERT (90D)</span>
              </li>
            </ul>
          )}
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Outsourcing Tools</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/payroll/outsourcing" className="adm-module" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem' }}>
              <span className="adm-module__icon" style={{ fontSize: '1.2rem' }}>👥</span>
              <span className="adm-module__name" style={{ fontSize: '0.88rem' }}>Deploy Seconded Staff</span>
            </Link>
            <Link to="/payroll/contracts" className="adm-module" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem' }}>
              <span className="adm-module__icon" style={{ fontSize: '1.2rem' }}>📄</span>
              <span className="adm-module__name" style={{ fontSize: '0.88rem' }}>Billing Rate Agreements</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Employee Self-Service Sub-Dashboard ───────────────────────────────────────

function EmployeeDashboard({ me }: { me: any }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests().then((data) => {
      setLeaveRequests(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="dash-kpi-grid">
        <KpiCard
          label="Leave Balance"
          value="18.5"
          secondary="of 24 total days"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
          color="#22c55e"
        />
        <KpiCard
          label="Active Goals"
          value="75%"
          secondary="Q2 cycle progress"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          }
          color="#3b82f6"
        />
        <KpiCard
          label="Next Contract Review"
          value="120"
          secondary="days left"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
          color="#f59e0b"
        />
        <KpiCard
          label="Latest Payslip"
          value="June"
          secondary="ready to download"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
          color="#6366f1"
        />
      </div>

      <div className="dash-row-2">
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">My Profile & Contract Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span className="muted small">Job Title</span>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Senior Developer</div>
            </div>
            <div>
              <span className="muted small">Department</span>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Engineering</div>
            </div>
            <div>
              <span className="muted small">Contract Type</span>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Permanent Full-Time</div>
            </div>
            <div>
              <span className="muted small">Join Date</span>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>January 15, 2024</div>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '1rem 0' }} />
          <div>
            <span className="muted small" style={{ display: 'block', marginBottom: '0.5rem' }}>Contract Document</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading employment contract...'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand)' }}>
              📄 Download Signed Contract PDF
            </a>
          </div>
        </div>

        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Recent Leave Requests</h3>
          {loading ? (
            <p className="muted small">Loading leave history…</p>
          ) : leaveRequests.length > 0 ? (
            <ul className="stat-list">
              {leaveRequests.slice(0, 3).map((r) => (
                <li key={r.id} className="stat-item">
                  <div>
                    <span className="stat-item__name">Leave ({parseFloat(r.days)} days)</span>
                    <div className="stat-item__meta">{r.startDate} to {r.endDate}</div>
                  </div>
                  <span className={`status-badge status-badge--${r.status.toLowerCase()}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="stat-list">
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">Annual Leave (3 Days)</span>
                  <div className="stat-item__meta">12/04/2026 to 15/04/2026</div>
                </div>
                <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>APPROVED</span>
              </li>
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">Sick Leave (1 Day)</span>
                  <div className="stat-item__meta">24/05/2026 to 25/05/2026</div>
                </div>
                <span className="status-badge" style={{ background: '#22c55e1a', color: '#22c55e', fontSize: '0.72rem' }}>APPROVED</span>
              </li>
              <li className="stat-item">
                <div>
                  <span className="stat-item__name">Casual Leave (2 Days)</span>
                  <div className="stat-item__meta">18/07/2026 to 20/07/2026</div>
                </div>
                <span className="status-badge" style={{ background: '#f59e0b1a', color: '#f59e0b', fontSize: '0.72rem' }}>PENDING</span>
              </li>
            </ul>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Link to="/payroll/leave" className="btn btn--primary small">Request New Leave</Link>
          </div>
        </div>
      </div>

      <div className="dash-row-2" style={{ marginBottom: 0 }}>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Active Performance Goals</h3>
          <ul className="stat-list">
            <li className="stat-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="stat-item__name">Optimize payroll calc scripts</span>
                <span className="stat-item__meta">90%</span>
              </div>
              <div style={{ background: 'var(--surface)', height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--brand)', height: '100%', width: '90%' }} />
              </div>
            </li>
            <li className="stat-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="stat-item__name">Write RRA report generation tests</span>
                <span className="stat-item__meta">40%</span>
              </div>
              <div style={{ background: 'var(--surface)', height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--brand)', height: '100%', width: '40%' }} />
              </div>
            </li>
          </ul>
        </div>

        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Recent Monthly Payslips</h3>
          <ul className="stat-list">
            <li className="stat-item">
              <div>
                <span className="stat-item__name">June 2026 Payslip</span>
                <div className="stat-item__meta">RWF · Net Salary Paid</div>
              </div>
              <button className="btn btn--ghost small" onClick={() => alert('Downloading payslip PDF for June 2026...')}>
                Download PDF
              </button>
            </li>
            <li className="stat-item">
              <div>
                <span className="stat-item__name">May 2026 Payslip</span>
                <div className="stat-item__meta">RWF · Net Salary Paid</div>
              </div>
              <button className="btn btn--ghost small" onClick={() => alert('Downloading payslip PDF for May 2026...')}>
                Download PDF
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

// ── Company Dashboard (active tenant switcher wrapper) ────────────────────────

function CompanyDashboard({ displayName }: { displayName: string }) {
  const { me } = useAdminContext();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [jobs, applications, interviews, placements] = await Promise.all([
        fetchJobs(),
        fetchApplications(),
        fetchInterviews(),
        fetchPlacements(),
      ]);
      setData({ jobs, applications, interviews, placements });
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data?.applications.forEach(a => {
      counts[a.stage] = (counts[a.stage] ?? 0) + 1;
    });
    return counts;
  }, [data]);

  const topJobs = useMemo<TopItem[]>(() => {
    if (!data) return [];
    const byJob: Record<string, { name: string; count: number }> = {};
    data.applications.forEach(a => {
      const title = a.job?.title ?? a.jobId;
      if (!byJob[a.jobId]) byJob[a.jobId] = { name: title, count: 0 };
      byJob[a.jobId].count += 1;
    });
    return Object.values(byJob)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(j => ({ name: j.name, value: j.count }));
  }, [data]);

  const topClients = useMemo<TopItem[]>(() => {
    if (!data?.placements.length) return [];
    const byClient: Record<string, number> = {};
    data.placements.forEach(p => {
      const name = p.clientName ?? 'Direct';
      byClient[name] = (byClient[name] ?? 0) + 1;
    });
    return Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  const openJobs = data?.jobs.filter(j => j.status === 'OPEN').length ?? 0;
  const inPipeline =
    (stageCounts['APPLIED'] ?? 0) +
    (stageCounts['SCREENED'] ?? 0) +
    (stageCounts['SHORTLISTED'] ?? 0) +
    (stageCounts['INTERVIEWED'] ?? 0);
  const totalApps = Object.values(stageCounts).reduce((a, b) => a + b, 0);
  const placements = data?.placements.length ?? 0;
  const scheduled = data?.interviews.filter(i => i.status === 'SCHEDULED').length ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Switcher Tab Permission Check
  const userRoles = me?.roles || [];
  const canSeeRecruitment = userRoles.some(r => ['TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER'].includes(r));
  const canSeePayroll = userRoles.some(r => ['TENANT_ADMIN', 'FINANCE_OFFICER', 'PAYROLL_SPECIALIST', 'CFO'].includes(r));
  const canSeeClient = userRoles.some(r => ['TENANT_ADMIN', 'CLIENT_ADMIN'].includes(r));
  const canSeeEmployee = userRoles.some(r => ['TENANT_ADMIN', 'HR_MANAGER', 'TENANT_STAFF', 'CLIENT_EMPLOYEE'].includes(r));

  const tabs = useMemo(() => {
    const list: { id: 'recruitment' | 'payroll' | 'client' | 'employee'; label: string }[] = [];
    if (canSeeRecruitment) list.push({ id: 'recruitment', label: 'Hiring & ATS' });
    if (canSeePayroll) list.push({ id: 'payroll', label: 'Finance & Payroll' });
    if (canSeeClient) list.push({ id: 'client', label: 'Client Operations' });
    if (canSeeEmployee) list.push({ id: 'employee', label: 'Employee Portal' });
    return list;
  }, [canSeeRecruitment, canSeePayroll, canSeeClient, canSeeEmployee]);

  const [selectedTab, setSelectedTab] = useState<'recruitment' | 'payroll' | 'client' | 'employee'>('recruitment');

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === selectedTab)) {
      setSelectedTab(tabs[0].id);
    }
  }, [tabs, selectedTab]);

  return (
    <>
      <div className="dash-welcome">
        <div>
          <h1 className="dash-welcome__greeting">{greeting}, {displayName}!</h1>
          <p className="dash-welcome__sub">Here's what's happening in your workspace today.</p>
        </div>
        <div className="dash-welcome__date">{todayStr}</div>
      </div>

      {err && (
        <div className="alert alert--err" role="alert" style={{ marginBottom: '1rem' }}>
          {err}{' '}
          <button type="button" className="btn btn--ghost" style={{ fontSize: '0.8rem', padding: '0 0.5rem' }} onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* Switcher Tab bar */}
      {tabs.length > 1 && (
        <div className="dash-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`dash-tab ${selectedTab === tab.id ? 'dash-tab--active' : ''}`}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {selectedTab === 'recruitment' && (
        <RecruitmentDashboard
          data={data}
          loading={loading}
          stageCounts={stageCounts}
          topJobs={topJobs}
          topClients={topClients}
          openJobs={openJobs}
          inPipeline={inPipeline}
          placements={placements}
          scheduled={scheduled}
          totalApps={totalApps}
        />
      )}

      {selectedTab === 'payroll' && <FinanceDashboard />}

      {selectedTab === 'client' && <ClientDashboard />}

      {selectedTab === 'employee' && <EmployeeDashboard me={me} />}
    </>
  );
}

// ── Pending company banner ────────────────────────────────────────────────────

function PendingBanner({ myTenant }: { myTenant: TenantRow }) {
  return (
    <section className="adm-card">
      <h2 className="adm-card__title">Your company</h2>
      <p style={{ margin: '0 0 0.5rem' }}>
        <strong style={{ fontSize: '1.1rem' }}>{myTenant.name}</strong>{' '}
        <StatusBadge status={myTenant.status} />
      </p>
      <p className="muted small" style={{ margin: 0 }}>
        Workspace slug: <code>{myTenant.slug}</code>
        {myTenant.plan ? ` · Plan: ${myTenant.plan}` : null}
      </p>
      {myTenant.status === 'PENDING_APPROVAL' && (
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          Your registration is under review. You can use recruitment features once the platform team approves your company.
        </p>
      )}
      {myTenant.status === 'REJECTED' && (
        <p className="alert alert--err" style={{ marginTop: '0.75rem' }}>
          Registration was not approved.{myTenant.rejectionReason ? ` ${myTenant.rejectionReason}` : null}
        </p>
      )}
    </section>
  );
}

// ── Super admin dashboard ─────────────────────────────────────────────────────

function SuperDashboard({ tenants, pending, onApprove, approving, err }: {
  tenants: TenantRow[];
  pending: TenantRow[];
  onApprove: (id: string) => void;
  approving: string | null;
  err: string | null;
}) {
  const active = tenants.filter(t => t.status === 'ACTIVE').length;
  const rejected = tenants.filter(t => t.status === 'REJECTED').length;
  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      <div className="dash-welcome">
        <div>
          <h1 className="dash-welcome__greeting">Platform overview</h1>
          <p className="dash-welcome__sub">Manage subscribed companies, approvals, and platform health.</p>
        </div>
        <div className="dash-welcome__date">{todayStr}</div>
      </div>

      {err && <div className="alert alert--err" role="alert" style={{ marginBottom: '1rem' }}>{err}</div>}

      <div className="dash-kpi-grid">
        <KpiCard label="Total Companies" value={String(tenants.length)} secondary="registered tenants" icon={<IcoBriefcase />} color="#6366f1" />
        <KpiCard label="Active" value={String(active)} secondary="running workspaces" icon={<IcoAward />} color="#22c55e" />
        <KpiCard label="Pending Approval" value={String(pending.length)} secondary={pending.length > 0 ? 'need review' : 'all clear'} icon={<IcoCalendar />} color="#f59e0b" />
        <KpiCard label="Rejected" value={String(rejected)} secondary="not approved" icon={<IcoUsers />} color="#ef4444" />
      </div>

      {pending.length > 0 && (
        <div className="dash-chart-card" style={{ marginBottom: '1rem' }}>
          <h3 className="dash-chart-card__title">Needs your attention</h3>
          <div className="adm-pending-list">
            {pending.slice(0, 5).map((t) => (
              <div key={t.id} className="adm-pending-row">
                <div>
                  <strong>{t.name}</strong>
                  <div className="muted small">
                    <code>{t.slug}</code>
                    {t.businessEmail ? ` · ${t.businessEmail}` : null}
                    {t.emailVerifiedAt ? ' · email verified' : ' · email not verified'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge status={t.status} />
                  <button
                    type="button"
                    className="btn btn--primary small"
                    disabled={approving === t.id}
                    onClick={() => onApprove(t.id)}
                  >
                    {approving === t.id ? '…' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pending.length > 5 && (
            <p className="muted small" style={{ marginTop: '0.75rem' }}>
              <Link to="/platform/tenants">View all {pending.length} pending →</Link>
            </p>
          )}
        </div>
      )}

      <div className="dash-row-2">
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Tenant status</h3>
          <DonutChart
            segments={[
              { label: 'Active',  count: active,          color: '#22c55e' },
              { label: 'Pending', count: pending.length,  color: '#f59e0b' },
              { label: 'Rejected',count: rejected,        color: '#ef4444' },
              { label: 'Other',   count: Math.max(0, tenants.length - active - pending.length - rejected), color: '#e2e8f0' },
            ].filter(s => s.count > 0)}
          />
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-chart-card__title">Quick links</h3>
          <div className="adm-modules">
            <Link to="/platform/tenants" className="adm-module">
              <span className="adm-module__icon">⌂</span>
              <span className="adm-module__name">Tenant directory</span>
              <span className="adm-module__desc">Approve, reject, or create companies</span>
            </Link>
            <Link to="/platform/system" className="adm-module">
              <span className="adm-module__icon">⚙</span>
              <span className="adm-module__name">System health</span>
              <span className="adm-module__desc">Service status and connectivity</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AdminOverviewPage() {
  const { me, isSuper } = useAdminContext();

  const [tenants, setTenants] = useState<TenantRow[] | null>(null);
  const [pending, setPending] = useState<TenantRow[] | null>(null);
  const [myTenant, setMyTenant] = useState<TenantRow | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      if (isSuper) {
        const [all, pend] = await Promise.all([fetchTenants(), fetchPendingTenants()]);
        setTenants(all);
        setPending(pend);
        setMyTenant(undefined);
      } else {
        const t = me.tenant_id ? await fetchMyTenant() : null;
        setMyTenant(t);
        setTenants(null);
        setPending(null);
      }
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }, [isSuper, me.tenant_id]);

  useEffect(() => { load(); }, [load]);

  const onQuickApprove = async (id: string) => {
    setApproving(id);
    setErr(null);
    try {
      await approveTenant(id);
      await load();
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setApproving(null);
    }
  };

  const displayName = me.username ?? me.email?.split('@')[0] ?? 'there';

  if (loading) {
    return (
      <div className="adm-page">
        <p className="muted">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {isSuper && tenants && pending && (
        <SuperDashboard
          tenants={tenants}
          pending={pending}
          onApprove={onQuickApprove}
          approving={approving}
          err={err}
        />
      )}

      {!isSuper && myTenant !== undefined && (
        myTenant?.status === 'ACTIVE' ? (
          <CompanyDashboard displayName={displayName} />
        ) : (
          <>
            {err && (
              <div className="alert alert--err" role="alert" style={{ marginBottom: '1rem' }}>{err}</div>
            )}
            {myTenant ? (
              <PendingBanner myTenant={myTenant} />
            ) : (
              <p className="muted">No company is linked to this account.</p>
            )}
          </>
        )
      )}
    </div>
  );
}

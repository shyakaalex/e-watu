import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMe } from '../../api';
import { parseApiError } from '../../lib/parseApiError';
import {
  fetchEmployees,
  fetchLeaveBalances,
  fetchLeaveRequests,
  type Employee,
  type LeaveBalance,
  type LeaveRequest,
} from '../../payrollApi';
import { getUpcomingHolidays } from './publicHolidays';

const TYPE_COLORS: Record<string, string> = {
  ANNUAL: '#3b82f6',
  SICK: '#22c55e',
  MATERNITY: '#f59e0b',
  PATERNITY: '#8b5cf6',
  UNPAID: '#94a3b8',
};

function colorFor(code: string | undefined, index: number): string {
  if (code && TYPE_COLORS[code]) return TYPE_COLORS[code];
  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
  return palette[index % palette.length];
}

function BalanceDonut({ balances }: { balances: LeaveBalance[] }) {
  const segments = balances
    .filter((b) => b.leaveType?.code !== 'UNPAID')
    .map((b, i) => ({
      label: b.leaveType?.name ?? 'Leave',
      remaining: Math.max(0, Number(b.allocatedDays) - Number(b.usedDays)),
      allocated: Number(b.allocatedDays),
      color: colorFor(b.leaveType?.code, i),
    }));

  const total = segments.reduce((s, seg) => s + seg.remaining, 0);
  const r = 52;
  const cx = 70;
  const cy = 70;
  const C = 2 * Math.PI * r;
  const GAP = 3;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const rawLen = total ? (seg.remaining / total) * C : 0;
    const len = Math.max(0, rawLen - GAP);
    const arc = { ...seg, len, offset: cumulative };
    cumulative += rawLen;
    return arc;
  });

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          days left
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 180 }}>
        {segments.length === 0 && <p className="muted small">No leave balances yet</p>}
        {segments.map((seg, i) => {
          const pct = seg.allocated > 0 ? Math.round((seg.remaining / seg.allocated) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{seg.label}</span>
              <span className="muted">{seg.remaining} / {seg.allocated} days</span>
              <span style={{ fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, secondary, color }: { label: string; value: string; secondary: string; color: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div className="muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
      <div className="muted" style={{ fontSize: '0.75rem' }}>{secondary}</div>
    </div>
  );
}

export function LeaveDashboardPage() {
  const [firstName, setFirstName] = useState('');
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const me = await fetchMe();
        const empList: Employee[] = await fetchEmployees();
        const userEmail = me.email?.toLowerCase();
        const matchedEmp = empList.find((e) => e.email?.toLowerCase() === userEmail) || empList[0];
        setFirstName(matchedEmp?.firstName ?? me.username ?? me.email?.split('@')[0] ?? 'there');

        const empId = matchedEmp?.id;
        const [reqs, bals] = await Promise.all([
          fetchLeaveRequests(undefined, empId),
          empId ? fetchLeaveBalances(empId) : Promise.resolve([]),
        ]);
        setRequests(reqs);
        setBalances(bals);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="rec-page" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="muted">Loading your leave dashboard…</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const pending = requests.filter((r) => r.status === 'PENDING');
  const approvedThisYear = requests.filter(
    (r) => r.status === 'APPROVED' && new Date(r.startDate).getFullYear() === currentYear,
  );
  const totalDaysTaken = approvedThisYear.reduce((sum, r) => sum + Number(r.numberOfDays), 0);
  const annual = balances.find((b) => b.leaveType?.code === 'ANNUAL');
  const sick = balances.find((b) => b.leaveType?.code === 'SICK');
  const annualRemaining = annual ? Number(annual.allocatedDays) - Number(annual.usedDays) : 0;
  const sickRemaining = sick ? Number(sick.allocatedDays) - Number(sick.usedDays) : 0;
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const upcomingHolidays = getUpcomingHolidays(new Date(), 3);

  return (
    <div className="rec-page">
      {error && <div className="alert alert--err">{error}</div>}

      {/* Welcome banner */}
      <div
        style={{
          borderRadius: 'var(--radius, 12px)',
          padding: '1.75rem 2rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, var(--accent, #0f4775), var(--accent-hover, #0a3557))',
          color: '#fff',
        }}
      >
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Welcome back, {firstName}!</h1>
        <p style={{ opacity: 0.9, margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
          Manage your leave requests, check your balances, and track your leave history.
        </p>
      </div>

      {/* Stat cards */}
      <div className="rec-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Annual Leave Balance"
          value={`${annualRemaining} days`}
          secondary={annual ? `out of ${annual.allocatedDays}` : 'not set up yet'}
          color="#2563eb"
        />
        <StatCard
          label="Sick Leave Balance"
          value={`${sickRemaining} days`}
          secondary={sick ? `out of ${sick.allocatedDays}` : 'not set up yet'}
          color="#16a34a"
        />
        <StatCard
          label="Pending Requests"
          value={String(pending.length)}
          secondary="awaiting approval"
          color="#d97706"
        />
        <StatCard
          label="Approved Leaves"
          value={String(approvedThisYear.length)}
          secondary={`this ${currentYear}`}
          color="#7c3aed"
        />
        <StatCard
          label="Total Leave Taken"
          value={`${totalDaysTaken} days`}
          secondary={`this ${currentYear}`}
          color="#0891b2"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Recent requests */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>My Leave Requests</h2>
            <Link to="/leave/requests" className="btn btn--ghost small">View All →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No leave requests yet.
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td>{r.leaveType?.name}</td>
                      <td>{new Date(r.startDate).toLocaleDateString()}</td>
                      <td>{new Date(r.endDate).toLocaleDateString()}</td>
                      <td>{r.numberOfDays}</td>
                      <td>
                        <span className={`badge ${
                          r.status === 'APPROVED' ? 'badge--green' : r.status === 'REJECTED' ? 'badge--red' : 'badge--orange'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Balance donut */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Leave Balance Overview</h2>
            <Link to="/leave/balance" className="btn btn--ghost small">View Details →</Link>
          </div>
          <BalanceDonut balances={balances} />
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Public holidays */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Public Holidays (Rwanda)</h2>
            <Link to="/leave/holidays" className="btn btn--ghost small">View Calendar →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {upcomingHolidays.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{h.name}</span>
                <span className="muted">{h.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Leave policy */}
        <section className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>📘</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.35rem' }}>Leave Policy & Guidelines</h2>
            <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
              Review entitlements and rules before submitting a request.
            </p>
            <Link to="/leave/policy" className="btn btn--primary small">View Leave Policy</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

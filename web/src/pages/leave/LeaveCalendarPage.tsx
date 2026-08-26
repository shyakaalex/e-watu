import { useEffect, useMemo, useState } from 'react';
import { parseApiError } from '../../lib/parseApiError';
import { fetchMyEmployee, fetchLeaveRequests, type LeaveRequest } from '../../payrollApi';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS: Record<string, string> = {
  APPROVED: '#22c55e',
  PENDING: '#f59e0b',
  REJECTED: '#ef4444',
};

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinRange(day: Date, start: Date, end: Date): boolean {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

export function LeaveCalendarPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => new Date());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const matchedEmp = await fetchMyEmployee();
        setRequests(await fetchLeaveRequests(undefined, matchedEmp?.id));
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const items: { date: Date | null }[] = [];
    for (let i = 0; i < startOffset; i++) items.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) items.push({ date: new Date(year, month, d) });
    return items;
  }, [cursor]);

  const today = new Date();

  if (loading) {
    return (
      <div className="rec-page" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="muted">Loading your leave calendar…</p>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">My Leave Calendar</h1>
          <p className="muted">Your approved and pending leave dates at a glance.</p>
        </div>
      </div>

      {error && <div className="alert alert--err">{error}</div>}

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn--ghost small"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            ← Prev
          </button>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <button
            type="button"
            className="btn btn--ghost small"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            Next →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '0.5rem' }}>
          {WEEKDAYS.map((w) => (
            <div key={w} className="muted" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              {w}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {cells.map((cell, i) => {
            if (!cell.date) return <div key={i} />;
            const matches = requests.filter(
              (r) => r.status !== 'REJECTED' && isWithinRange(cell.date!, new Date(r.startDate), new Date(r.endDate)),
            );
            const isToday = isSameDay(cell.date, today);
            return (
              <div
                key={i}
                style={{
                  minHeight: 64,
                  borderRadius: 8,
                  border: isToday ? '2px solid var(--accent, #0284c7)' : '1px solid var(--line, #e2e8f0)',
                  padding: '0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: isToday ? 700 : 500 }}>{cell.date.getDate()}</span>
                {matches.map((r) => (
                  <span
                    key={r.id}
                    title={`${r.leaveType?.name} — ${r.status}`}
                    style={{
                      fontSize: '0.65rem',
                      padding: '1px 4px',
                      borderRadius: 4,
                      color: '#fff',
                      background: STATUS_COLORS[r.status] ?? '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {r.leaveType?.code ?? 'Leave'}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', fontSize: '0.8rem' }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span className="muted">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

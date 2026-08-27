import { useCallback, useEffect, useState } from 'react';
import { clockIn, clockOut, fetchMyAttendance, type AttendanceRecord } from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getUTCFullYear() === now.getFullYear() && d.getUTCMonth() === now.getMonth() && d.getUTCDate() === now.getDate();
}

const STATUS_BADGE: Record<AttendanceRecord['status'], string> = {
  PRESENT: 'badge--green',
  LATE: 'badge--orange',
  ABSENT: 'badge--red',
};

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setRecords(await fetchMyAttendance());
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = records.find((r) => isToday(r.date));

  const onClockIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await clockIn();
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const onClockOut = async () => {
    setError(null);
    setBusy(true);
    try {
      await clockOut();
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="adm-page">
        <p className="muted">Loading attendance…</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Attendance</h1>
        <p className="adm-page__lead">Clock in and out, and review your recent attendance history.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      <div className="adm-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div className="muted small">Today</div>
          {today ? (
            <div>
              Clocked in at {today.clockInAt ? new Date(today.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              {today.clockOutAt && (
                <> · Clocked out at {new Date(today.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
              )}
              {' '}
              <span className={`badge ${STATUS_BADGE[today.status]}`}>{today.status}</span>
            </div>
          ) : (
            <div className="muted">Not clocked in yet.</div>
          )}
        </div>
        <button type="button" className="btn btn--primary" disabled={busy || !!today?.clockInAt} onClick={onClockIn}>
          Clock In
        </button>
        <button type="button" className="btn" disabled={busy || !today?.clockInAt || !!today?.clockOutAt} onClick={onClockOut}>
          Clock Out
        </button>
      </div>

      <div className="adm-card">
        <h3 style={{ margin: '0 0 0.75rem' }}>Last 30 Days</h3>
        {records.length === 0 ? (
          <p className="muted small">No attendance records yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="muted">{r.clockInAt ? new Date(r.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="muted">{r.clockOutAt ? new Date(r.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

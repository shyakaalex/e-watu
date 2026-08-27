import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { fetchMe } from '../../api';
import { fetchHolidays, createHoliday, deleteHoliday, type Holiday } from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function LeaveHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, list] = await Promise.all([fetchMe(), fetchHolidays()]);
      setCanManage(
        me.roles?.some((r) => ['TENANT_ADMIN', 'HR_MANAGER', 'MANAGING_DIRECTOR'].includes(r)) ?? false,
      );
      setHolidays(list);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    try {
      await createHoliday({ name, month, day, note: note || undefined });
      setShowForm(false);
      setName('');
      setMonth(1);
      setDay(1);
      setNote('');
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Remove this holiday?')) return;
    setError(null);
    try {
      await deleteHoliday(id);
      await load();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Public Holidays</h1>
          <p className="muted">Company holiday calendar — used across leave planning.</p>
        </div>
        {canManage && (
          <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add Holiday'}
          </button>
        )}
      </div>

      {error && <div className="alert alert--err">{error}</div>}

      {showForm && (
        <form className="card form" onSubmit={onCreate} style={{ marginBottom: '1rem' }}>
          <label>
            Name
            <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              Month
              <select className="auth-input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              Day
              <input
                className="auth-input"
                type="number"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                required
              />
            </label>
          </div>
          <label>
            Note (optional)
            <input className="auth-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. First Friday of August" />
          </label>
          <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>Save Holiday</button>
        </form>
      )}

      <section className="card">
        {loading ? (
          <p className="muted">Loading holidays…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Holiday</th>
                  <th>Date</th>
                  <th>Note</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 4 : 3} className="muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No holidays configured yet.
                    </td>
                  </tr>
                ) : (
                  holidays.map((h) => (
                    <tr key={h.id}>
                      <td><strong>{h.name}</strong></td>
                      <td>
                        {new Date(h.nextDate).toLocaleDateString(undefined, {
                          weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </td>
                      <td className="muted">{h.note || '—'}</td>
                      {canManage && (
                        <td>
                          <button type="button" className="btn btn--ghost small" onClick={() => onDelete(h.id)}>
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
          Movable religious holidays (Eid al-Fitr, Eid al-Adha) are announced separately each year and should be added manually.
        </p>
      </section>
    </div>
  );
}

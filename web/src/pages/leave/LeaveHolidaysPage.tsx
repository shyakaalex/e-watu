import { getAllHolidaysSorted } from './publicHolidays';

export function LeaveHolidaysPage() {
  const holidays = getAllHolidaysSorted();

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Public Holidays (Rwanda)</h1>
          <p className="muted">Official public holidays observed for the coming year.</p>
        </div>
      </div>

      <section className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Holiday</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h, i) => (
                <tr key={i}>
                  <td><strong>{h.name}</strong></td>
                  <td>{h.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td className="muted">{h.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
          Movable religious holidays (Eid al-Fitr, Eid al-Adha) are announced separately each year and aren't listed here.
        </p>
      </section>
    </div>
  );
}

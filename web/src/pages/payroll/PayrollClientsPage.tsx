import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPayrollConfigClients } from '../../payrollApi';

export function PayrollClientsPage() {
  const [clients, setClients] = useState<{ clientId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setClients(await fetchPayrollConfigClients());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rec-page">
      <header className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Clients</h1>
          <p className="rec-page__sub">Manage payroll clients and their configuration.</p>
        </div>
        <div className="rec-page__actions">
          <Link to="/payroll/settings" className="btn btn--primary">Add client</Link>
        </div>
      </header>

      {err && <p className="auth-err">{err}</p>}
      {loading && <p className="muted">Loading clients…</p>}

      {!loading && clients.length === 0 && (
        <div className="rec-empty">
          <p>No clients configured yet.</p>
          <Link to="/payroll/settings" className="btn btn--primary" style={{ marginTop: '1rem' }}>
            Configure first client
          </Link>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Client ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.clientId}>
                  <td>{c.clientId}</td>
                  <td>
                    <Link to={`/payroll/settings?client=${encodeURIComponent(c.clientId)}`}>
                      View settings
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

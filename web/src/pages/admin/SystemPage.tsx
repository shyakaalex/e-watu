import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchAllServiceHealth, type ServiceHealth } from '../../api';
import { useAdminContext } from './useAdminContext';

export function SystemPage() {
  const { isSuper } = useAdminContext();
  const [services, setServices] = useState<ServiceHealth[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setServices(await fetchAllServiceHealth());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isSuper) load();
  }, [isSuper, load]);

  if (!isSuper) {
    return <Navigate to="/platform" replace />;
  }

  const allOk = services?.every((s) => s.ok) ?? false;

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">System health</h1>
        <p className="adm-page__lead">
          Connectivity to E-Watu microservices (local development endpoints).
        </p>
      </header>

      <div className="adm-toolbar">
        <p className="muted" style={{ margin: 0 }}>
          {loading ? 'Checking…' : allOk ? 'All services responding' : 'One or more services unreachable'}
        </p>
        <button type="button" className="btn" onClick={() => load()} disabled={loading}>
          Re-check
        </button>
      </div>

      {services && (
        <section className="adm-card">
          <div className="adm-health-grid">
            {services.map((s) => (
              <div key={s.name} className={`adm-health${s.ok ? ' adm-health--ok' : ' adm-health--err'}`}>
                <div className="adm-health__name">{s.name}</div>
                <div className={`adm-health__status${s.ok ? '' : ' muted'}`}>
                  {s.ok ? `OK · ${s.detail ?? s.status}` : s.detail ?? `HTTP ${s.status ?? 'error'}`}
                </div>
                <div className="muted small" style={{ marginTop: '0.35rem', wordBreak: 'break-all' }}>
                  {s.url}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="adm-card">
        <h2 className="adm-card__title">Infrastructure (local)</h2>
        <ul className="muted" style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
          <li>
            PostgreSQL — <code>localhost:15432</code> (Docker)
          </li>
          <li>
            MinIO — <code>localhost:9000</code> console <code>:9001</code>
          </li>
          <li>
            Web SPA — <code>localhost:5173</code>
          </li>
        </ul>
      </section>
    </div>
  );
}

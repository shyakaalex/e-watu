import { useEffect, useState, type CSSProperties } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { fetchPublicTenant, type PublicTenant } from '../../publicApi';
import './public-careers.css';

export function PublicCareersLayout() {
  const { slug = '' } = useParams();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    fetchPublicTenant(slug)
      .then(setTenant)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [slug]);

  const brand = tenant?.primaryColor ?? '#0d9488';

  return (
    <div className="careers" style={{ '--careers-brand': brand } as CSSProperties}>
      <header className="careers__header">
        <div className="careers__header-inner">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt="" className="careers__logo" />
          ) : (
            <span className="careers__logo-placeholder" aria-hidden />
          )}
          <div>
            <h1 className="careers__company">{tenant?.name ?? slug}</h1>
            <p className="careers__tagline">Careers at {tenant?.name ?? 'our company'}</p>
          </div>
        </div>
        {tenant && (
          <nav className="careers__nav">
            <Link to={`/apply/${slug}`}>Open roles</Link>
            <Link to={`/apply/${slug}/talent-pool`}>Join talent pool</Link>
          </nav>
        )}
      </header>

      {err && (
        <main className="careers__main">
          <div className="alert alert--err">{err}</div>
        </main>
      )}

      {tenant && (
        <main className="careers__main">
          <Outlet context={{ tenant }} />
        </main>
      )}

      <footer className="careers__foot">
        <span>Powered by E-Watu</span>
      </footer>
    </div>
  );
}

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchMyTenant, updateTenantSettings, type TenantRow } from '../../api';
import { parseError } from './parseError';
import { useAdminContext } from './useAdminContext';

export function SettingsPage() {
  const { me, isSuper } = useAdminContext();
  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f4775');
  const [accentColor, setAccentColor] = useState('#e38109');
  const [website, setWebsite] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('RWF');
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(1);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const t = await fetchMyTenant();
      setTenant(t);
      if (t) {
        setName(t.name);
        setLogoUrl(t.logoUrl ?? '');
        setPrimaryColor(t.primaryColor ?? '#0f4775');
        setAccentColor(t.accentColor ?? '#e38109');
        setWebsite(t.website ?? '');
        setBaseCurrency(t.baseCurrency ?? 'RWF');
        setFiscalYearStartMonth(t.fiscalYearStartMonth ?? 1);
      }
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isSuper) {
    return <Navigate to="/platform" replace />;
  }

  if (!me.tenant_id) {
    return (
      <div className="adm-page">
        <p className="muted">No company linked to this account.</p>
      </div>
    );
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setErr(null);
    setSaved(false);
    try {
      await updateTenantSettings({
        name,
        logoUrl: logoUrl || undefined,
        primaryColor,
        accentColor,
        website: website || undefined,
        baseCurrency,
        fiscalYearStartMonth,
      });
      setSaved(true);
      await load();
    } catch (e) {
      setErr(parseError(e));
    }
  };

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Company settings</h1>
        <p className="adm-page__lead">
          Branding and configuration for your workspace (EWatu Phase 1).
        </p>
      </header>

      {tenant && (
        <p className="muted small">
          Public careers page:{' '}
          <a href={`/apply/${tenant.slug}`} target="_blank" rel="noreferrer">
            /apply/{tenant.slug}
          </a>
        </p>
      )}

      {err && <div className="alert alert--err">{err}</div>}
      {saved && <div className="alert alert--info">Settings saved.</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && tenant && (
        <form className="adm-card form" onSubmit={onSubmit}>
          <label>
            Company name
            <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Logo URL
            <input className="auth-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
          </label>
          <div className="adm-grid-2">
            <label>
              Primary color
              <input className="auth-input" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </label>
            <label>
              Accent color
              <input className="auth-input" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
            </label>
          </div>
          <label>
            Website
            <input className="auth-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
          </label>
          <div className="adm-grid-2">
            <label>
              Base currency
              <input className="auth-input" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} maxLength={8} />
            </label>
            <label>
              Fiscal year starts (month 1–12)
              <input
                className="auth-input"
                type="number"
                min={1}
                max={12}
                value={fiscalYearStartMonth}
                onChange={(e) => setFiscalYearStartMonth(Number(e.target.value))}
              />
            </label>
          </div>
          <button type="submit" className="btn btn--primary">
            Save settings
          </button>
        </form>
      )}
    </div>
  );
}

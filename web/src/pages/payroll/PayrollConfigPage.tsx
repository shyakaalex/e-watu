import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { fetchPayrollConfig, updatePayrollConfig, type PayrollConfig } from '../../payrollApi';

export function PayrollConfigPage() {
  const [cfg, setCfg] = useState<PayrollConfig | null>(null);
  const [currency, setCurrency] = useState('RWF');
  const [payDateDay, setPayDateDay] = useState(28);
  const [rssbPension, setRssbPension] = useState(0.05);
  const [rssbMedical, setRssbMedical] = useState(0.075);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchPayrollConfig();
      setCfg(data);
      setCurrency(data.currency);
      setPayDateDay(data.payDateDayOfMonth);
      const rules = data.statutoryRules ?? {};
      setRssbPension(Number(rules.rssbPensionEmployeeRate ?? 0.05));
      setRssbMedical(Number(rules.rssbMedicalRate ?? 0.075));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const updated = await updatePayrollConfig({
        currency,
        payDateDayOfMonth: payDateDay,
        statutoryRules: {
          ...(cfg?.statutoryRules ?? {}),
          rssbPensionEmployeeRate: rssbPension,
          rssbMedicalRate: rssbMedical,
        },
      });
      setCfg(updated);
      setMsg('Configuration saved.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="rec-page"><p className="muted">Loading config…</p></div>;

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Payroll configuration</h1>
      {err && <div className="alert alert--err">{err}</div>}
      {msg && <div className="alert alert--ok">{msg}</div>}
      <form className="card rec-form-card" onSubmit={onSave}>
        <div className="rec-form__grid">
          <label className="rec-form__label">
            Currency
            <input className="auth-input" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
          <label className="rec-form__label">
            Pay date (day of month)
            <input className="auth-input" type="number" min={1} max={31} value={payDateDay} onChange={(e) => setPayDateDay(Number(e.target.value))} />
          </label>
          <label className="rec-form__label">
            RSSB pension rate
            <input className="auth-input" type="number" step="0.001" value={rssbPension} onChange={(e) => setRssbPension(Number(e.target.value))} />
          </label>
          <label className="rec-form__label">
            RSSB medical rate
            <input className="auth-input" type="number" step="0.001" value={rssbMedical} onChange={(e) => setRssbMedical(Number(e.target.value))} />
          </label>
        </div>
        <div className="rec-form__actions">
          <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

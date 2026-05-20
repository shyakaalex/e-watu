import { type FormEvent, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { submitTalentPool, type PublicTenant } from '../../publicApi';

export function PublicTalentPoolPage() {
  const { slug = '' } = useParams();
  const { tenant } = useOutletContext<{ tenant: PublicTenant }>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await submitTalentPool(slug, {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        currentTitle: currentTitle || undefined,
      });
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="careers__card">
        <h2>You're in our talent pool</h2>
        <p className="muted">Thanks for registering with {tenant.name}.</p>
        <Link to={`/apply/${slug}`}>View open roles</Link>
      </div>
    );
  }

  return (
    <div className="careers__card">
      <h2 className="careers__section-title">Join the talent pool</h2>
      <p className="muted">Share your profile — we'll contact you when a matching role opens.</p>
      {err && <div className="alert alert--err">{err}</div>}
      <form className="form" onSubmit={onSubmit}>
        <label>
          First name
          <input className="auth-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label>
          Last name
          <input className="auth-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Phone
          <input className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Current role
          <input className="auth-input" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Submitting…' : 'Join talent pool'}
        </button>
      </form>
    </div>
  );
}

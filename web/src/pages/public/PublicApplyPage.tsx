import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { submitPublicApplication } from '../../publicApi';

export function PublicApplyPage() {
  const { slug = '', jobId = '' } = useParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await submitPublicApplication(slug, jobId, {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        coverLetter: coverLetter || undefined,
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
        <h2>Application submitted</h2>
        <p className="muted">Thank you. Our team will review your application.</p>
        <Link to={`/apply/${slug}`}>← Back to jobs</Link>
      </div>
    );
  }

  return (
    <div className="careers__card">
      <Link to={`/apply/${slug}`} className="muted small">
        ← All jobs
      </Link>
      <h2 className="careers__section-title">Apply for this role</h2>
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
          Cover letter
          <textarea
            className="auth-input"
            rows={4}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}

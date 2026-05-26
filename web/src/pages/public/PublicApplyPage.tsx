import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { presignPublicCv, submitPublicApplication } from '../../publicApi';

export function PublicApplyPage() {
  const { slug = '', jobId = '' } = useParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      let cvUrl: string | undefined;
      if (cvFile) {
        const presign = await presignPublicCv(slug, {
          objectKey: `applications/${jobId}/${cvFile.name}`,
          contentType: cvFile.type,
          fileSize: cvFile.size,
        });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(presign.method, presign.uploadUrl);
          Object.entries(presign.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(cvFile);
        });
        cvUrl = presign.objectUrl;
      }
      await submitPublicApplication(slug, jobId, {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        coverLetter: coverLetter || undefined,
        cvUrl,
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
          CV (optional)
          <input
            type="file"
            className="auth-input"
            accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          />
          {uploadPct !== null && <span className="muted small"> Uploading {uploadPct}%</span>}
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

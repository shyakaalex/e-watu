import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchMyProfile,
  updateMyProfile,
  fetchMyDocuments,
  uploadMyDocument,
  deleteMyDocument,
  type MyProfile,
  type MyDocument,
} from '../../payrollApi';
import { parseApiError } from '../../lib/parseApiError';

export function MyProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [documents, setDocuments] = useState<MyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [phone, setPhone] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [p, docs] = await Promise.all([fetchMyProfile(), fetchMyDocuments().catch(() => [])]);
      setProfile(p);
      setDocuments(docs);
      if (p) {
        setPhone(p.phone ?? '');
        setBankAccount(p.bankAccount ?? '');
        setBankName(p.bankName ?? '');
        setBankBranch(p.bankBranch ?? '');
        setEmergencyContactName(p.emergencyContactName ?? '');
        setEmergencyContactPhone(p.emergencyContactPhone ?? '');
      }
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        phone: phone || undefined,
        bankAccount: bankAccount || undefined,
        bankName: bankName || undefined,
        bankBranch: bankBranch || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
      });
      setProfile(updated);
      setSaved(true);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const doc = await uploadMyDocument(file, docExpiryDate || undefined);
      setDocuments((prev) => [doc, ...prev]);
      setDocExpiryDate('');
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDeleteDoc = async (id: string) => {
    if (!confirm('Remove this document?')) return;
    setError(null);
    try {
      await deleteMyDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(parseApiError(e).message);
    }
  };

  if (loading) {
    return (
      <div className="adm-page">
        <p className="muted">Loading your profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="adm-page">
        <p className="muted">No employee record is linked to this account.</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">My Profile</h1>
        <p className="adm-page__lead">Personal info, bank details, and emergency contacts on file.</p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}
      {saved && <div className="alert alert--ok">Profile updated.</div>}

      <section className="adm-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Name</div>
            <div>{profile.firstName} {profile.lastName}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Work Email</div>
            <div>{profile.email}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Job Title</div>
            <div>{profile.jobTitle}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Department</div>
            <div>{profile.department ?? '—'}</div>
          </div>
        </div>
      </section>

      <form className="adm-card form" onSubmit={onSave} style={{ marginBottom: '1.5rem' }}>
        <h2 className="adm-card__title">Editable Details</h2>
        <label>
          Phone
          <input className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <div className="adm-grid-2">
          <label>
            Emergency Contact Name
            <input className="auth-input" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
          </label>
          <label>
            Emergency Contact Phone
            <input className="auth-input" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
          </label>
        </div>
        <div className="adm-grid-2">
          <label>
            Bank Name
            <input className="auth-input" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </label>
          <label>
            Bank Branch
            <input className="auth-input" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
          </label>
        </div>
        <label>
          Bank Account Number
          <input className="auth-input" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Leave blank to keep unchanged" />
        </label>
        <button type="submit" className="btn btn--primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <section className="adm-card">
        <h2 className="adm-card__title">My Documents</h2>
        <p className="muted small" style={{ marginBottom: '1rem' }}>
          Personal documents — ID copies, certificates, etc.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <label style={{ flex: '1 1 220px' }}>
            File
            <input
              ref={fileInputRef}
              type="file"
              className="auth-input"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              disabled={uploading}
            />
          </label>
          <label style={{ flex: '0 1 180px' }}>
            Expiry date <span className="muted small">(optional, for licenses/certs)</span>
            <input
              type="date"
              className="auth-input"
              value={docExpiryDate}
              onChange={(e) => setDocExpiryDate(e.target.value)}
              disabled={uploading}
            />
          </label>
        </div>
        {documents.length === 0 ? (
          <p className="muted small">No documents uploaded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Uploaded</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.downloadUrl ? <a href={d.downloadUrl} target="_blank" rel="noreferrer">{d.name}</a> : d.name}</td>
                  <td className="muted">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                  <td className="muted">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <button type="button" className="btn btn--ghost small" onClick={() => onDeleteDoc(d.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

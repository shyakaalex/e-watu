import { type FormEvent, useState } from 'react';
import { changeMyPassword } from '../../api';
import { parseError } from './parseError';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setErr(null);
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setErr('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setErr(parseError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Change password</h1>
        <p className="adm-page__lead">Update the password for your own account.</p>
      </header>

      {err && <div className="alert alert--err">{err}</div>}
      {saved && <div className="alert alert--ok">Password changed successfully.</div>}

      <form className="adm-card form" onSubmit={onSubmit} style={{ maxWidth: '420px' }}>
        <label>
          Current password
          <input
            className="auth-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          New password
          <input
            className="auth-input"
            type="password"
            minLength={10}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirm new password
          <input
            className="auth-input"
            type="password"
            minLength={10}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}

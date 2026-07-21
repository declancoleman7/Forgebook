import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

export default function ChangePassword() {
  const { setPassword } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (newPassword.length < 8) return showToast('Use at least 8 characters');
    if (newPassword !== newPasswordConfirm) return showToast("Passwords don't match");
    setBusy(true);
    const res = await setPassword(newPassword);
    setBusy(false);
    if (!res.ok) return showToast(res.message || "Couldn't update your password");
    showToast('Password updated');
    navigate('/settings');
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/settings')}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Change Password</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="field">
        <label>New password</label>
        <input type="password" placeholder="At least 8 characters" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <div className="field">
        <label>Confirm password</label>
        <input type="password" placeholder="Type it again" autoComplete="new-password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
      </div>

      <div className="notice">
        Use a password you don't already rely on elsewhere. Forgebook is a small, self-run
        hobby project, not a professional security service — Supabase (our database provider)
        handles and stores your password, hashed; Forgebook itself never sees it in plain text.
      </div>

      <div className="detail-actions">
        <button className="btn btn-ghost btn-block" onClick={() => navigate('/settings')}>Cancel</button>
        <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>Save password</button>
      </div>
    </div>
  );
}

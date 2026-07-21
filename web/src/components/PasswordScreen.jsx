import { useState } from 'react';
import Icon from '../icons.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

// The blocking screen for both "finish your invite" (mode "setup") and
// "forgot password" (mode "recovery") -- same fields, different framing,
// both funnel into setPassword(). Ported from the old app's
// passwordFormHtml()/showPasswordScreen().
export default function PasswordScreen({ mode }) {
  const { email, setPassword, isDisplayNameAvailable } = useAuth();
  const showToast = useToast();
  const isSetup = mode === 'setup';
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const name = displayName.trim();
    if (isSetup && !name) return showToast('Enter a display name first');
    if (newPassword.length < 8) return showToast('Use at least 8 characters');
    if (newPassword !== newPasswordConfirm) return showToast("Passwords don't match");
    if (isSetup && !(await isDisplayNameAvailable(name))) return showToast('That name is already taken — try another');
    setBusy(true);
    const res = await setPassword(newPassword);
    setBusy(false);
    if (!res.ok) return showToast(res.message || "Couldn't set that password");
    // Stage 3 will wire updateDisplayName(name) here for the setup path,
    // once the profiles data layer exists.
    showToast(isSetup ? 'Password set — welcome!' : 'Password updated');
  };

  return (
    <div className="gate">
      <div className="gate__card">
        <div className="gate__brand"><Icon name="book" size={26} /> Forgebook</div>
        <div className="gate__tagline">
          {isSetup
            ? `You're invited${email ? `, ${email}` : ''}. Set a password to finish creating your account.`
            : 'Choose a new password for your account.'}
        </div>

        {isSetup && (
          <div className="field gate__field" style={{ marginTop: 20 }}>
            <label>Display name</label>
            <input type="text" placeholder="What should we call you?" autoComplete="nickname"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <div className="label-hint" style={{ marginTop: 4 }}>Shown as the author on any recipe you share.</div>
          </div>
        )}
        <div className="field gate__field" style={{ marginTop: isSetup ? 0 : 20 }}>
          <label>New password</label>
          <input type="password" placeholder="At least 8 characters" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field gate__field" style={{ marginTop: 0 }}>
          <label>Confirm password</label>
          <input type="password" placeholder="Type it again" autoComplete="new-password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-block" disabled={busy} onClick={submit}>
          {isSetup ? 'Set password & continue' : 'Update password'}
        </button>

        <div className="notice" style={{ marginTop: 16, textAlign: 'left' }}>
          This is a small, self-run hobby project — not a professional security service.
          Please use a password you don't already rely on elsewhere. Forgebook never sees your
          password itself; it's handled and stored, hashed, by Supabase, our database provider.
        </div>
      </div>
    </div>
  );
}

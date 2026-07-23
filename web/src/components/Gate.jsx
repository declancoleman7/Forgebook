import { useEffect, useState } from 'react';
import Icon from '../icons.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import { containsBlockedContent } from '../utils/moderation.js';

// Debounced live "is this name taken" check, shared by the sign-up form and
// (later, Stage 3) the invite/password-setup screen -- same #auth-display-name
// idea as the old app's checkDisplayNameLive().
function useDisplayNameAvailability(name) {
  const { isDisplayNameAvailable } = useAuth();
  const [hint, setHint] = useState(null); // null | 'checking' | 'available' | 'taken'
  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed) { setHint(null); return; }
    setHint('checking');
    const t = setTimeout(async () => {
      const available = await isDisplayNameAvailable(trimmed);
      setHint(available ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(t);
  }, [name, isDisplayNameAvailable]);
  return hint;
}

function AvailabilityHint({ hint }) {
  if (hint === 'taken') return <div className="label-hint" style={{ color: 'var(--blood-bright)' }}>That name is already taken.</div>;
  if (hint === 'available') return <div className="label-hint" style={{ color: 'var(--success)' }}>Available.</div>;
  return <div className="label-hint" />;
}

// Sign in / create account / "check your email" -- ported from the old
// app's authFormHtml(), shared here between the boot gate and (Stage 3)
// signed-out Settings.
export function AuthForm() {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const showToast = useToast();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [signupSent, setSignupSent] = useState(null); // email string, or null
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const nameHint = useDisplayNameAvailability(mode === 'signup' ? displayName : '');
  const [busy, setBusy] = useState(false);

  const doSignIn = async () => {
    if (!email.trim() || !email.includes('@')) return showToast('Enter your email');
    if (!password) return showToast('Enter your password');
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) return showToast(res.message);
    setPassword('');
  };

  const doForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) return showToast('Enter your email above first, then try again');
    showToast('Sending…');
    const res = await requestPasswordReset(email);
    showToast(res.message);
  };

  const doSignUp = async () => {
    const name = displayName.trim();
    if (!name) return showToast('Enter a display name first');
    if (containsBlockedContent(name)) return showToast("That name isn't allowed — please choose another");
    if (!email.trim() || !email.includes('@')) return showToast('Enter your email');
    if (newPassword.length < 8) return showToast('Use at least 8 characters');
    if (newPassword !== newPasswordConfirm) return showToast("Passwords don't match");
    if (nameHint === 'taken') return showToast('That name is already taken — try another');
    setBusy(true);
    const res = await signUp(email, newPassword, name);
    setBusy(false);
    if (!res.ok) return showToast(res.message);
    setNewPassword(''); setNewPasswordConfirm(''); setDisplayName('');
    setSignupSent(email);
  };

  if (signupSent) {
    return (
      <>
        <div className="empty-state__sub" style={{ padding: 0 }}>
          Check <strong>{signupSent}</strong> for a confirmation link. Once you click it, come back here and sign in.
        </div>
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}
          onClick={() => { setMode('signin'); setSignupSent(null); }}>
          Back to sign in
        </button>
      </>
    );
  }

  if (mode === 'signup') {
    return (
      <>
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Display name</label>
          <input type="text" placeholder="What should we call you?" autoComplete="nickname"
            value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <div className="label-hint" style={{ marginTop: 4 }}>Shown as the author on any recipe you share.</div>
          <AvailabilityHint hint={nameHint} />
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input type="password" placeholder="At least 8 characters" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Confirm password</label>
          <input type="password" placeholder="Type it again" autoComplete="new-password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy} onClick={doSignUp}>Create account</button>
        <div className="settings-row__desc" style={{ marginTop: 10 }}>
          You'll get an email with a confirmation link — you can't sign in until you click it.
        </div>
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setMode('signin')}>
          Already have an account? Sign in
        </button>
      </>
    );
  }

  return (
    <>
      <div className="field" style={{ marginBottom: 10 }}>
        <label>Email</label>
        <input type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label>Password</label>
        <input type="password" placeholder="Your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block" disabled={busy} onClick={doSignIn}>Sign in</button>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={doForgotPassword}>Forgot password?</button>
      <div className="settings-row__desc" style={{ marginTop: 10 }}>
        New here?
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }} onClick={() => setMode('signup')}>Create an account</button>
      </div>
    </>
  );
}

export default function Gate() {
  return (
    <div className="gate">
      <div className="gate__card">
        <div className="gate__brand"><Icon name="book" size={26} /> Forgebook</div>
        <div className="gate__tagline">Your paint recipes, wherever you paint.</div>
        <div className="gate__field" style={{ marginTop: 20, textAlign: 'left' }}>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}

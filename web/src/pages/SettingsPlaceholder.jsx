import { useAuth } from '../auth/AuthContext.jsx';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

// Stage 1 stand-in for Settings -- just enough to verify the sign-out flow
// (confirm dialog -> signOut() -> back to the Gate) before Stage 3 builds
// the real page.
export default function SettingsPlaceholder() {
  const { signOut, email } = useAuth();
  const confirm = useConfirm();
  const showToast = useToast();

  const doSignOut = async () => {
    if (await confirm('Sign out of Forgebook?', { okLabel: 'Sign out' })) {
      await signOut();
      showToast('Signed out');
    }
  };

  return (
    <div className="page-enter">
      <div className="page-title">Settings</div>
      <div className="detail-sub">Signed in as {email} · Stage 3 will build the real page here.</div>
      <div className="settings-group" style={{ marginTop: 16 }}>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Sign out</div>
            <div className="settings-row__desc">You'll need to sign in again to use Forgebook.</div>
          </div>
          <button className="btn btn-danger" onClick={doSignOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useMyProfile, useUpdateDisplayName, useUploadAvatar } from '../queries/useProfile.js';
import { useMyHobbies, useAddHobby } from '../queries/useHobbies.js';
import { HOBBIES } from '../data/factions.js';
import { downscaleImageSquare } from '../utils/image.js';
import { promptInstall } from '../installPrompt.js';

// Ported from the old app's viewSettings(). Export/import and the
// recipe/paint counts near the bottom are deferred until Stage 3 builds
// the recipes/paints data layer -- everything else here is real.
export default function Settings() {
  const { email, signOut } = useAuth();
  const confirm = useConfirm();
  const showToast = useToast();
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const avatarInputRef = useRef(null);

  const profileQuery = useMyProfile();
  const updateDisplayName = useUpdateDisplayName();
  const uploadAvatar = useUploadAvatar();
  const hobbiesQuery = useMyHobbies();
  const addHobby = useAddHobby();

  const [nameDraft, setNameDraft] = useState(null); // null until first edited, then tracks the input

  const profile = profileQuery.data;
  const displayName = nameDraft ?? profile?.displayName ?? '';

  const saveDisplayName = async () => {
    try {
      await updateDisplayName.mutateAsync(displayName);
      showToast('Display name updated');
      setNameDraft(null);
    } catch (e) {
      showToast(e.message || "Couldn't save that — try again.");
    }
  };

  const onAvatarChosen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await downscaleImageSquare(file, 240);
    if (!url) return showToast('That image could not be read');
    showToast('Uploading…');
    try {
      await uploadAvatar.mutateAsync(url);
      showToast('Profile picture updated');
    } catch {
      showToast("Couldn't upload that — try again");
    }
  };

  const doSignOut = async () => {
    if (await confirm('Sign out of Forgebook?', { okLabel: 'Sign out' })) {
      await signOut();
      showToast('Signed out');
    }
  };

  const doAddHobby = async (hobbyId) => {
    try {
      await addHobby.mutateAsync(hobbyId);
    } catch (e) {
      showToast(e.message || "Couldn't add that hobby — try again.");
    }
  };

  const doInstall = () => {
    if (!promptInstall()) showToast("Use your browser menu → 'Install app' or 'Add to Home screen'");
  };

  const enabledHobbyIds = hobbiesQuery.data || ['warhammer'];
  const addableHobbies = HOBBIES.filter((h) => !enabledHobbyIds.includes(h.id));

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/u')}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Settings</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="section-label">Account</div>
      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">{email}</div>
            <div className="settings-row__desc">{profileQuery.isFetching ? 'Loading…' : ''}</div>
          </div>
          <button className="btn btn-ghost btn-sm" disabled={profileQuery.isFetching} onClick={() => profileQuery.refetch()}>Refresh</button>
        </div>
        <div className="settings-row" style={{ display: 'block' }}>
          <div className="settings-row__label">Display name</div>
          <div className="settings-row__desc" style={{ marginBottom: 10 }}>Shown as the author on any recipe you share.</div>
          <div className="field" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 0 }}>
            <input type="text" value={displayName} onChange={(e) => setNameDraft(e.target.value)} />
            <button className="btn btn-ghost btn-sm" disabled={updateDisplayName.isPending} onClick={saveDisplayName}>Save</button>
          </div>
        </div>
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar displayName={profile?.displayName} url={profile?.avatarUrl} size={44} />
            <div>
              <div className="settings-row__label">Profile picture</div>
              <div className="settings-row__desc">Shown next to your name in comments and search.</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => avatarInputRef.current?.click()}>Change</button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChosen} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Change password</div>
            <div className="settings-row__desc">Update the password you sign in with.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/change-password')}>Change</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Sign out</div>
            <div className="settings-row__desc">You'll need to sign in again to use Forgebook.</div>
          </div>
          <button className="btn btn-danger" onClick={doSignOut}>Sign out</button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Appearance</div>
            <div className="settings-row__desc">Dark suits painting under a lamp; light holds up in daylight too.</div>
          </div>
          <div className="theme-toggle" role="group" aria-label="Theme">
            <button type="button" className={`theme-toggle__btn ${theme === 'dark' ? 'is-active' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
            <button type="button" className={`theme-toggle__btn ${theme === 'light' ? 'is-active' : ''}`} onClick={() => setTheme('light')}>Light</button>
          </div>
        </div>
      </div>

      <div className="section-label">Hobbies</div>
      <div className="settings-group">
        {enabledHobbyIds.length > 1 && (
          <div className="settings-row">
            <div className="settings-row__desc">Switch which one's active from the dropdown in the top bar — Home, Recipes and Collection all follow it.</div>
          </div>
        )}
        {addableHobbies.length ? addableHobbies.map((h) => (
          <div className="settings-row" key={h.id}>
            <div>
              <div className="settings-row__label">{h.label}</div>
              <div className="settings-row__desc">Adds a {h.label} option alongside Warhammer.</div>
            </div>
            <button className="btn btn-primary btn-sm" disabled={addHobby.isPending} onClick={() => doAddHobby(h.id)}>Add</button>
          </div>
        )) : (
          <div className="settings-row"><div className="settings-row__desc">You're set up with every hobby Forgebook currently supports.</div></div>
        )}
      </div>

      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Install Forgebook</div>
            <div className="settings-row__desc">Add to your home screen for quicker, app-like access.</div>
          </div>
          <button className="btn btn-primary" onClick={doInstall}>Install</button>
        </div>
      </div>

      <div className="fine-print">
        Faction names are used to organise your own recipes. Forgebook is an unofficial hobby
        tool, not affiliated with or endorsed by Games Workshop. All emblems shipped with the
        app are original artwork. If you sign in, your email address and an encrypted password
        are stored with our database provider (Supabase) so your recipes can sync across
        devices — this is a small, self-run hobby project, not a professional security service,
        so please use a password you don't rely on elsewhere. An account is required to use
        Forgebook.
      </div>
    </div>
  );
}

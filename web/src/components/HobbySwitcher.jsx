import { useEffect, useRef, useState } from 'react';
import Icon from '../icons.jsx';
import { HOBBIES, hobby } from '../data/factions.js';
import { useActiveHobbyId, setActiveHobbyId } from '../hooks/useActiveHobby.js';
import { useMyHobbies } from '../queries/useHobbies.js';
import { useMyProfile, useUpdateDefaultHobby } from '../queries/useProfile.js';
import { useToast } from '../toast/ToastContext.jsx';

const STAR_PATH = 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2z';

// Ported from the old app's updateHobbySwitcher()/bindHobbySwitcherShell().
// Hidden entirely (not just empty) while only one hobby is enabled --
// invisible until a second hobby actually exists, same as every other
// hobby-switcher UI in this app.
export default function HobbySwitcher() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const showToast = useToast();
  const { data: enabledIds = ['warhammer'] } = useMyHobbies();
  const { data: profile } = useMyProfile();
  const activeHobbyId = useActiveHobbyId();
  const updateDefaultHobby = useUpdateDefaultHobby();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (enabledIds.length < 2) return null;

  const defaultId = profile?.defaultHobbyId || 'warhammer';

  const switchTo = (id) => {
    setActiveHobbyId(id);
    setOpen(false);
  };
  const setDefault = (id) => {
    updateDefaultHobby.mutate(id, { onError: () => showToast("Couldn't save that — try again.") });
  };

  return (
    <div className="hobby-switch" ref={wrapRef}>
      <button type="button" className="hobby-switch__trigger" aria-label="Switch hobby" aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <span className="hobby-switch__label">{hobby(activeHobbyId).label}</span>
        <Icon name="chevron" size={14} />
      </button>
      <div className={`hobby-switch__menu ${open ? '' : 'hidden'}`}>
        {HOBBIES.filter((h) => enabledIds.includes(h.id)).map((h) => (
          <div key={h.id} className="hobby-switch__row">
            <button type="button" className={`hobby-switch__item ${activeHobbyId === h.id ? 'is-active' : ''}`} onClick={() => switchTo(h.id)}>{h.label}</button>
            <button
              type="button"
              className={`hobby-switch__default-star ${defaultId === h.id ? 'is-on' : ''}`}
              title={defaultId === h.id ? 'Your default hobby' : 'Set as default'}
              aria-label={defaultId === h.id ? 'Your default hobby' : 'Set as default'}
              onClick={() => setDefault(h.id)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill={defaultId === h.id ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"><path d={STAR_PATH} /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

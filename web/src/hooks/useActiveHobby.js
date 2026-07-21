import { useSyncExternalStore } from 'react';
import { hobby } from '../data/factions.js';
import { useMyHobbies } from '../queries/useHobbies.js';
import { useMyProfile } from '../queries/useProfile.js';

const KEY = 'forgebook.activeHobby';
const listeners = new Set();

function getSnapshot() { return localStorage.getItem(KEY); }
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

export function setActiveHobbyId(id) {
  if (id === 'warhammer') localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, id);
  listeners.forEach((cb) => cb());
}

// Same fallback chain as the old app's getActiveHobbyId(): an explicit
// per-device choice (this device switched hobbies at some point) wins;
// otherwise fall back to the account's synced default (a NEW device picks
// up whichever hobby you're set up on elsewhere); otherwise Warhammer.
// The topbar switcher UI itself (and "set as default") is deferred --
// this hook is the one place that logic plugs into once it exists.
export function useActiveHobbyId() {
  const stored = useSyncExternalStore(subscribe, getSnapshot);
  const { data: enabledIds = ['warhammer'] } = useMyHobbies();
  const { data: profile } = useMyProfile();

  if (stored && enabledIds.includes(stored)) return stored;
  if (profile?.defaultHobbyId && enabledIds.includes(profile.defaultHobbyId)) return profile.defaultHobbyId;
  return 'warhammer';
}

export function useActiveHobby() {
  return hobby(useActiveHobbyId());
}

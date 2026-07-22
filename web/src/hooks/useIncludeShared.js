import { useSyncExternalStore } from 'react';

// Whether other users' shared recipes appear in browsing screens at all --
// same in-memory-only (not persisted), defaults-to-true toggle as the old
// app's state.includeShared, which every browsing screen (Recipes, Armies,
// Units) reads through getVisibleRecipes(). Deliberately not localStorage-
// backed, matching the old app: this resets to "on" each fresh session
// rather than sticking as a surprising, easy-to-forget-you-set-it filter.
let includeShared = true;
const listeners = new Set();

export function setIncludeShared(value) {
  includeShared = value;
  listeners.forEach((cb) => cb());
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return includeShared;
}

export function useIncludeShared() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

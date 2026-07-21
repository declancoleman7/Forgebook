import { useCallback, useMemo, useSyncExternalStore } from 'react';

const KEY = 'forgebook.factionArt'; // per-device personal override, never synced
const listeners = new Set();

// getSnapshot must return a referentially-stable value when nothing's
// changed -- returning the raw string (not a freshly-parsed object) keeps
// it a stable primitive; the JSON.parse happens separately, memoized on
// that string.
function readRaw() { return localStorage.getItem(KEY) || '{}'; }
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function parseAll(raw) { try { return JSON.parse(raw); } catch { return {}; } }

// A personal (this-device-only) faction emblem override -- separate from
// the admin-uploaded global override (Supabase-backed, shared with every
// signed-in user), which is deferred for now.
export function useFactionArt(factionId) {
  const raw = useSyncExternalStore(subscribe, readRaw);
  const all = useMemo(() => parseAll(raw), [raw]);

  const setArt = useCallback((dataUrl) => {
    const next = { ...parseAll(readRaw()), [factionId]: dataUrl };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      listeners.forEach((cb) => cb());
      return true;
    } catch {
      return false; // storage full
    }
  }, [factionId]);

  const clearArt = useCallback(() => {
    const next = { ...parseAll(readRaw()) };
    delete next[factionId];
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((cb) => cb());
  }, [factionId]);

  return [all[factionId] || null, setArt, clearArt];
}

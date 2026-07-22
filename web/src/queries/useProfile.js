import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

function nowIso() { return new Date().toISOString(); }
function defaultDisplayName(email) { return String(email || 'Someone').split('@')[0]; }

// A separate, fixed bucket (not CONFIG.photoBucket) so an avatar path can
// never collide with or be confused for a recipe photo path -- see
// schema.sql.
function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}

// The query function itself does what the old app's ensureProfile() did as
// a separate imperative step: every signed-in user needs exactly one
// `profiles` row, created lazily on first sign-in rather than via a DB
// trigger (this also backfills anyone invited before this feature shipped).
// Folding that into the fetch means "load my profile" and "create it if
// this is my very first sign-in" are the same query, not a side effect
// racing it.
async function fetchOrCreateMyProfile(userId, email, metadataDisplayName) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return { row: data, justCreated: false };

  const baseName = metadataDisplayName || defaultDisplayName(email);
  // display_name is unique (case-insensitive). The signup form checks this
  // live, but a narrow race (two people confirming the same name at once)
  // can still collide here -- try a couple of disambiguated names before
  // giving up.
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const name = attempt === 1 ? baseName : `${baseName} ${attempt}`;
    const { data: inserted, error: insErr } = await supabase.from('profiles').insert({ user_id: userId, display_name: name }).select().single();
    if (!insErr) return { row: inserted, justCreated: true };
    lastError = insErr;
    if (insErr.code !== '23505') break; // not a name collision -- don't keep retrying blindly
  }
  throw lastError;
}

export function useMyProfile() {
  const { userId, email, signupDisplayNameHint } = useAuth();
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { row, justCreated } = await fetchOrCreateMyProfile(userId, email, signupDisplayNameHint);
      return {
        userId,
        displayName: row.display_name,
        isAdmin: !!row.is_admin,
        avatarUrl: avatarUrl(row.avatar_path),
        defaultHobbyId: row.default_hobby_id || null,
        // True only on the query that actually inserted this profiles row --
        // i.e. this user's very first sign-in. Home reads it once to decide
        // whether to show the one-time "add a profile picture" nudge; a
        // later refetch (window refocus, etc.) finds the row already there
        // and correctly reports false, same as the old app's
        // consumeJustSignedUp() only ever firing true once.
        justSignedUp: justCreated,
      };
    },
    enabled: !!userId,
  });
}

export function useUpdateDisplayName() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name) => {
      const trimmed = String(name || '').trim();
      if (!trimmed) throw new Error('Enter a name first.');
      // Plain update, not upsert: upsert's ON CONFLICT DO UPDATE sets every
      // payload column including user_id itself, and schema.sql only
      // grants UPDATE on (display_name, updated_at) -- including user_id
      // in the payload gets the whole statement rejected with a 403.
      const { error } = await supabase.from('profiles').update({ display_name: trimmed, updated_at: nowIso() }).eq('user_id', userId);
      if (error) throw new Error("Couldn't save that — try again.");
      return trimmed;
    },
    onSuccess: (trimmed) => {
      qc.setQueryData(['profile', userId], (prev) => (prev ? { ...prev, displayName: trimmed } : prev));
    },
  });
}

export function useUpdateDefaultHobby() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hobbyId) => {
      const { error } = await supabase.from('profiles').update({ default_hobby_id: hobbyId, updated_at: nowIso() }).eq('user_id', userId);
      if (error) throw new Error("Couldn't save that — try again.");
      return hobbyId;
    },
    onSuccess: (hobbyId) => {
      qc.setQueryData(['profile', userId], (prev) => (prev ? { ...prev, defaultHobbyId: hobbyId } : prev));
    },
  });
}

export function useUploadAvatar() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dataUrl) => {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${userId}/avatar-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const { error: upErr } = await supabase.storage.from('avatar-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_path: path, updated_at: nowIso() }).eq('user_id', userId);
      if (dbErr) throw dbErr;
      return path;
    },
    onSuccess: (path) => {
      qc.setQueryData(['profile', userId], (prev) => (prev ? { ...prev, avatarUrl: avatarUrl(path) } : prev));
    },
  });
}

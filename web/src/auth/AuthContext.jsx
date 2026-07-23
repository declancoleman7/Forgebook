import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase.js';

const AuthContext = createContext(null);

// Ported from js/cloud.js's initCloud/signIn/signUp/setPassword/etc, minus
// the old app's own "am I done booting" gate: the old bootIntoApp() blocked
// on loadBook() fetching the whole book before showing anything past the
// splash. Here, "signed in" is enough to show the app shell immediately --
// each page's own TanStack Query hooks (Stage 2) handle their own loading
// state instead of one big blocking step.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking, null = signed out
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      // The invite / password-reset callback lands back here with ?code=...
      // (PKCE). Supabase's client consumes it internally above; strip it so
      // it doesn't sit in the address bar or confuse the router.
      if (location.search.includes('code=') || location.search.includes('error=')) {
        history.replaceState({}, '', location.pathname + (location.hash || '#/home'));
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    // Deliberately the same message for "no such account" and "wrong
    // password" -- distinguishing them would let someone probe which
    // invited addresses exist.
    if (error) return { ok: false, message: 'Incorrect email or password.' };

    // A ban is enforced here, at sign-in, not as a live mid-session kill --
    // a banned account's existing session (if any) keeps working until it
    // naturally expires. A brand new account has no profiles row yet
    // (ensureProfile() creates it lazily on first load, not here), so a
    // missing row fails open as "not banned" -- same reasoning as
    // isDisplayNameAvailable's own fail-open below.
    const { data: profileRow } = await supabase.from('profiles').select('is_banned').eq('user_id', data.session.user.id).maybeSingle();
    if (profileRow?.is_banned) {
      await supabase.auth.signOut();
      return { ok: false, message: 'This account has been suspended.' };
    }

    setSession(data.session);
    return { ok: true };
  }, []);

  // Sets password_set up front (unlike an invite, this account's password
  // isn't a separate step) so a confirmed signup lands straight in the app
  // instead of hitting the invite's password-setup screen.
  const signUp = useCallback(async (email, password, displayName) => {
    const redirect = location.origin + location.pathname;
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { password_set: true, display_name: displayName.trim() }, emailRedirectTo: redirect },
    });
    if (error) return { ok: false, message: error.message || "Couldn't create that account." };
    return { ok: true };
  }, []);

  // Used both to finish an invite (first password ever) and to change an
  // existing one.
  const setPassword = useCallback(async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password, data: { password_set: true } });
    if (error) return { ok: false, message: error.message || "Couldn't set that password." };
    setSession((s) => (s ? { ...s, user: data.user } : s));
    setPasswordRecovery(false);
    return { ok: true };
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const redirect = location.origin + location.pathname;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect });
    // Supabase resolves this the same way whether or not the address has an
    // account, specifically so the reset form can't be used to probe the
    // invite list.
    if (error && error.status >= 500) return { ok: false, message: 'Something went wrong — try again in a moment.' };
    return { ok: true, message: 'If that address has an account, a reset link is on its way.' };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const isDisplayNameAvailable = useCallback(async (name) => {
    const { data, error } = await supabase.rpc('display_name_available', { p_name: name });
    if (error) return true; // fail open on the live hint -- the unique index is the real boundary
    return !!data;
  }, []);

  const isSignedIn = !!(session && session.user);
  const value = {
    booting: session === undefined,
    isSignedIn,
    email: isSignedIn ? session.user.email : null,
    userId: isSignedIn ? session.user.id : null,
    // Only meaningful for the very first fetch after a fresh signup, before
    // any profiles row exists -- see useMyProfile()'s fetchOrCreateMyProfile.
    signupDisplayNameHint: isSignedIn ? session.user.user_metadata?.display_name || null : null,
    needsPasswordSetup: isSignedIn && !session.user.user_metadata?.password_set,
    inPasswordRecovery: passwordRecovery,
    signIn,
    signUp,
    setPassword,
    requestPasswordReset,
    signOut,
    isDisplayNameAvailable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

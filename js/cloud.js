// ============================================================
// Forgebook — cloud layer (auth + sync)
//
// DESIGN: LOCAL-FIRST.
// localStorage stays the single source of truth that the UI reads from, so
// the app keeps working at the painting table with no signal. The cloud is a
// background replica: we push local changes up and pull remote ones down when
// we can, and merge per-record by timestamp (last write wins). Nothing in the
// UI ever blocks on the network.
//
// If the Supabase library fails to load (offline, CDN blocked, whatever), the
// app degrades to exactly the v0.4 behaviour: a local-only paint book.
// ============================================================

let sb = null;               // supabase client, or null if unavailable
let session = null;          // current auth session, or null
let syncing = false;
let cloudError = null;

const SYNC_KEYS = { lastSync: "forgebook.lastSync" };

function isSignedIn() { return !!(session && session.user); }
function currentEmail() { return session && session.user ? session.user.email : null; }
function cloudAvailable() { return !!sb; }
function lastSyncedAt() { return localStorage.getItem(SYNC_KEYS.lastSync) || null; }

// An invited account has a session (from the invite link) but no password of
// its own yet — that's the signal to show the "set your password" screen
// instead of the normal app.
function needsPasswordSetup() {
  return isSignedIn() && !(session.user.user_metadata && session.user.user_metadata.password_set);
}

let passwordRecovery = false; // true once a "forgot password" link has been followed
function inPasswordRecovery() { return passwordRecovery; }

// The soft gate's escape hatch. Once chosen, this device never sees the gate
// again until the person signs out — browsing without an account is a
// first-class, remembered choice, not a one-time click-through.
function isGuest() { return localStorage.getItem(KEYS.guest) === "1"; }
function continueAsGuest() { localStorage.setItem(KEYS.guest, "1"); }

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
async function initCloud() {
  if (!window.supabase || !CONFIG.supabaseUrl) {
    cloudError = "offline";
    return false;
  }
  try {
    sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    // Registered before the getSession() await below, not after: a recovery
    // or invite link's ?code=... can be exchanged (and its one-shot event
    // fired) during that very await, and PASSWORD_RECOVERY is the only signal
    // we get that this was a reset link rather than an ordinary session — miss
    // it and "forgot password" quietly degrades into "log me back in".
    sb.auth.onAuthStateChange((event, s) => {
      const wasSignedIn = isSignedIn();
      session = s;
      if (event === "PASSWORD_RECOVERY") passwordRecovery = true;
      if (event === "SIGNED_IN" && !wasSignedIn) onSignedIn();
      if (event === "SIGNED_OUT") onSignedOut();
      if (typeof render === "function") render();
    });

    const { data } = await sb.auth.getSession();
    session = data ? data.session : null;

    // The invite / password-reset callback lands back here with ?code=...
    // (PKCE). Supabase consumes it above; strip it so it doesn't sit in the
    // address bar or confuse our hash router.
    if (location.search.includes("code=") || location.search.includes("error=")) {
      history.replaceState({}, "", location.pathname + (location.hash || "#/home"));
    }

    return true;
  } catch (e) {
    cloudError = "offline";
    sb = null;
    return false;
  }
}

// ---------------------------------------------------------------
// Auth — email + password. No self-serve sign-up anywhere in this file:
// the only way an account is ever created is an admin invite from the
// Supabase dashboard, which lands the person on the password-setup screen
// (see needsPasswordSetup, above). Combined with public sign-ups disabled in
// the dashboard, the invite list IS the access control — there's no
// signup form to find or brute-force.
// ---------------------------------------------------------------
async function signIn(email, password) {
  if (!sb) return { ok: false, message: "No connection — try again when you're online." };
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    // Deliberately the same message for "no such account" and "wrong
    // password" — distinguishing them would let someone probe which
    // invited addresses exist.
    return { ok: false, message: "Incorrect email or password." };
  }
  session = data.session; // don't wait on the auth-state event for this
  return { ok: true };
}

// Used both to finish an invite (first password ever) and to change an
// existing one — the only difference is which screen calls it.
async function setPassword(password) {
  if (!sb) return { ok: false, message: "No connection — try again when you're online." };
  const { data, error } = await sb.auth.updateUser({
    password,
    data: { password_set: true },
  });
  if (error) return { ok: false, message: error.message || "Couldn't set that password." };
  if (session) session.user = data.user;
  passwordRecovery = false;
  return { ok: true };
}

async function requestPasswordReset(email) {
  if (!sb) return { ok: false, message: "No connection — try again when you're online." };
  const redirect = location.origin + location.pathname;
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect });
  // Supabase resolves this the same way whether or not the address has an
  // account, specifically so the reset form can't be used to probe the
  // invite list. We keep that property rather than surfacing `error` here.
  if (error && error.status >= 500) {
    return { ok: false, message: "Something went wrong — try again in a moment." };
  }
  return { ok: true, message: "If that address has an account, a reset link is on its way." };
}

async function signOutCloud() {
  if (sb) await sb.auth.signOut();
  session = null;
  onSignedOut();
}

function onSignedIn() {
  // A brand-new device holds nothing but the seed recipes; there's no point
  // asking to merge those. Only offer if the person has actually made things.
  const mine = getAllRecipeRows().filter((r) => !r.seed && !r.deleted);
  if (mine.length) {
    pendingMerge = mine.length;
    if (typeof render === "function") render();
  } else {
    // Nothing worth keeping locally: clear the seeds and take the cloud's word.
    clearLocalBook();
    syncNow({ full: true });
  }
}

function onSignedOut() {
  // Don't leave one person's book sitting on a shared device.
  clearLocalBook();
  localStorage.removeItem(SYNC_KEYS.lastSync);
  resetStore();
  if (typeof render === "function") render();
}

function clearLocalBook() {
  localStorage.setItem(KEYS.recipes, JSON.stringify([]));
  localStorage.setItem(KEYS.paints, JSON.stringify([]));
  localStorage.setItem(KEYS.recents, JSON.stringify([]));
}

let pendingMerge = 0; // >0 when we're asking whether to upload a local book

async function acceptMerge() {
  pendingMerge = 0;
  // Strip the seed flag from nothing — seeds are dropped, real work is kept
  // and stamped so it wins the merge and gets pushed.
  const rows = getAllRecipeRows().filter((r) => !r.seed);
  const paints = getAllPaintRows().filter((p) => !p.seed);
  save(KEYS.recipes, rows);
  save(KEYS.paints, paints);
  await syncNow({ full: true });
  showToast("Your book is now synced to your account");
}

async function declineMerge() {
  pendingMerge = 0;
  clearLocalBook();
  await syncNow({ full: true });
  if (typeof render === "function") render();
}

// ---------------------------------------------------------------
// Sync
// ---------------------------------------------------------------
function nowIso() { return new Date().toISOString(); }

function toRemoteRecipe(r, userId) {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    faction: r.faction,
    unit: r.unit,
    difficulty: r.difficulty,
    photo_path: r.photoPath || null,
    steps: r.steps || [],
    notes: r.notes || "",
    published: !!r.published,
    updated_at: r.updatedAt,
    deleted: !!r.deleted,
  };
}

function fromRemoteRecipe(row) {
  return {
    id: row.id,
    name: row.name,
    faction: row.faction,
    unit: row.unit,
    difficulty: row.difficulty,
    photoPath: row.photo_path || null,
    photo: row.photo_path ? photoUrl(row.photo_path) : null,
    steps: row.steps || [],
    notes: row.notes || "",
    published: !!row.published,
    updatedAt: row.updated_at,
    deleted: !!row.deleted,
  };
}

function toRemotePaint(p, userId) {
  return {
    id: p.id, user_id: userId, name: p.name, brand: p.brand,
    hex: p.hex, type: p.type, updated_at: p.updatedAt, deleted: !!p.deleted,
  };
}

function fromRemotePaint(row) {
  return {
    id: row.id, name: row.name, brand: row.brand, hex: row.hex,
    type: row.type, updatedAt: row.updated_at, deleted: !!row.deleted,
  };
}

function photoUrl(path) {
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.photoBucket}/${path}`;
}

// Upload any photo still sitting in localStorage as a base64 data URL, and
// swap it for a storage path. Keeps the database small and the app fast.
async function uploadPendingPhotos(recipes, userId) {
  let changed = false;
  for (const r of recipes) {
    if (!r.photo || !String(r.photo).startsWith("data:") || r.deleted) continue;
    try {
      const blob = await (await fetch(r.photo)).blob();
      const path = `${userId}/${r.id}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const { error } = await sb.storage
        .from(CONFIG.photoBucket)
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) continue; // leave it local; we'll retry next sync
      r.photoPath = path;
      r.photo = photoUrl(path);
      changed = true;
    } catch (e) {
      // Offline or storage unavailable — the data URL stays put and we retry.
    }
  }
  return changed;
}

// Merge one remote row into a local array. Last write wins, per record.
function mergeRow(localArr, remote, keyFn) {
  const idx = localArr.findIndex((x) => x.id === remote.id);
  if (idx === -1) {
    localArr.push(remote);
    return true;
  }
  const local = localArr[idx];
  if (!local.updatedAt || remote.updatedAt >= local.updatedAt) {
    localArr[idx] = remote;
    return true;
  }
  return false; // local is newer — it'll be pushed instead
}

async function syncNow(opts = {}) {
  if (!sb || !isSignedIn() || syncing || pendingMerge) return { ok: false };
  syncing = true;
  if (typeof render === "function") render();

  const userId = session.user.id;
  let ok = true;

  try {
    let recipes = getAllRecipeRows();
    let paints = getAllPaintRows();

    // ORDER MATTERS: pull and merge BEFORE pushing.
    //
    // If we pushed first, a stale local copy would upsert straight over a
    // newer edit made on another device — silent data loss. So we fetch the
    // remote state, let the newer timestamp win per record, and only then
    // push back the records where the local copy is genuinely the newer one.
    //
    // We always fetch the full set rather than a delta: it's a paint book, not
    // a data warehouse, and correctness is worth more than the few kB saved.
    const [rRes, pRes] = await Promise.all([
      sb.from("recipes").select("*").eq("user_id", userId),
      sb.from("paints").select("*").eq("user_id", userId),
    ]);
    if (rRes.error) throw rRes.error;
    if (pRes.error) throw pRes.error;

    const remoteRecipes = (rRes.data || []).map(fromRemoteRecipe);
    const remotePaints = (pRes.data || []).map(fromRemotePaint);

    // What did the server have before we merged? Used to decide what to push.
    const remoteStamp = new Map();
    remoteRecipes.forEach((r) => remoteStamp.set("r:" + r.id, r.updatedAt));
    remotePaints.forEach((p) => remoteStamp.set("p:" + p.id, p.updatedAt));

    remoteRecipes.forEach((r) => mergeRow(recipes, r));
    remotePaints.forEach((p) => mergeRow(paints, p));

    // Sample data has no business in a signed-in account.
    recipes = recipes.filter((r) => !r.seed);
    paints = paints.filter((p) => !p.seed);

    // Photos next, so anything we push already points at storage rather than
    // carrying a base64 blob into the database.
    await uploadPendingPhotos(recipes, userId);

    // Push only where local is newer than (or absent from) the server.
    const isNewerLocally = (row, key) => {
      const remote = remoteStamp.get(key);
      return !remote || (row.updatedAt && row.updatedAt > remote);
    };
    const pushRecipes = recipes.filter((r) => isNewerLocally(r, "r:" + r.id));
    const pushPaints = paints.filter((p) => isNewerLocally(p, "p:" + p.id));

    if (pushRecipes.length) {
      const { error } = await sb.from("recipes").upsert(pushRecipes.map((r) => toRemoteRecipe(r, userId)));
      if (error) throw error;
    }
    if (pushPaints.length) {
      const { error } = await sb.from("paints").upsert(pushPaints.map((p) => toRemotePaint(p, userId)));
      if (error) throw error;
    }

    save(KEYS.recipes, recipes);
    save(KEYS.paints, paints);
    localStorage.setItem(SYNC_KEYS.lastSync, nowIso());
    cloudError = null;
  } catch (e) {
    ok = false;
    cloudError = "sync";
  }

  syncing = false;
  if (typeof render === "function") render();
  return { ok };
}

// Push in the background after any local change. Debounced so a burst of edits
// doesn't fire a burst of requests.
let syncTimer = null;
function queueSync() {
  if (!isSignedIn()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), 1200);
}

window.addEventListener("online", () => { if (isSignedIn()) syncNow(); });

function syncStatusLabel() {
  if (!isSignedIn()) return null;
  if (syncing) return "Syncing\u2026";
  if (!navigator.onLine) return "Offline \u2014 changes saved on this device";
  if (cloudError === "sync") return "Sync failed \u2014 will retry";
  const t = lastSyncedAt();
  if (!t) return "Not synced yet";
  const mins = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  if (mins < 1) return "Synced just now";
  if (mins < 60) return `Synced ${mins} min ago`;
  return "Synced " + new Date(t).toLocaleDateString();
}

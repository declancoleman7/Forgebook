// ============================================================
// Forgebook — cloud layer (auth + sync)
//
// DESIGN: LIVE. An account is required to use the app at all. Supabase is
// the only copy of your book — every save/delete writes straight through to
// it, and localStorage is used only as an in-memory-style render cache (kept
// fresh by loadBook(), never a second source of truth to reconcile). There is
// no merge, no queue, no "sync later": a write either lands in the cloud or
// the person is told it didn't.
//
// If the Supabase library fails to load (offline, CDN blocked, whatever),
// the app can't do anything useful — see cloudAvailable() gating the sign-in
// form.
// ============================================================

let sb = null;               // supabase client, or null if unavailable
let session = null;          // current auth session, or null
let syncing = false;
let cloudError = null;

const SYNC_KEYS = { lastSync: "forgebook.lastSync" };

function isSignedIn() { return !!(session && session.user); }
function currentEmail() { return session && session.user ? session.user.email : null; }
function currentUserId() { return session && session.user ? session.user.id : null; }
function cloudAvailable() { return !!sb; }
function lastSyncedAt() { return localStorage.getItem(SYNC_KEYS.lastSync) || null; }

// Read from the local profiles cache (kept current by ensureProfile) rather
// than a live query — this is checked on every render of the faction page,
// and the real enforcement is server-side RLS regardless, so a client-side
// cache is fine here: worst case it's a render behind after admin changes.
function isAdmin() {
  if (!isSignedIn()) return false;
  const p = readJSON(KEYS.profiles, []).find((x) => x.userId === currentUserId());
  return !!(p && p.isAdmin);
}

// An invited account has a session (from the invite link) but no password of
// its own yet — that's the signal to show the "set your password" screen
// instead of the normal app.
function needsPasswordSetup() {
  return isSignedIn() && !(session.user.user_metadata && session.user.user_metadata.password_set);
}

let passwordRecovery = false; // true once a "forgot password" link has been followed
function inPasswordRecovery() { return passwordRecovery; }

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
// Auth — email + password. Two ways an account gets created: an admin
// invite from the Supabase dashboard (lands on the password-setup screen,
// see needsPasswordSetup above), or self-serve sign-up below. Self-serve
// requires "Enable email signups" AND "Confirm email" both on in the
// Supabase dashboard's Auth settings — the confirmation link is the only
// thing standing between this form and anyone with a working email address.
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

// Sets password_set up front (unlike an invite, this account's password
// isn't a separate step) so a confirmed signup lands straight in the app
// instead of hitting the invite's password-setup screen. display_name rides
// along in user_metadata since there's no profiles row yet to put it in —
// no session exists until the confirmation link is clicked — and
// ensureProfile reads it back out when it creates that row on first sign-in.
async function signUp(email, password, displayName) {
  if (!sb) return { ok: false, message: "No connection — try again when you're online." };
  const redirect = location.origin + location.pathname;
  const { error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { password_set: true, display_name: displayName.trim() }, emailRedirectTo: redirect },
  });
  if (error) return { ok: false, message: error.message || "Couldn't create that account." };
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
  ensureProfile();
  // If we're already booted, a session just appeared out from under a
  // running app (an invite/recovery link resolving mid-session) — refetch so
  // the book on screen is this account's, not whatever an earlier signed-out
  // state left in the cache. The very first sign-in is instead handled by
  // bootIntoApp(), via decideBootState() -> render() below.
  if (appBooted) loadBook();
}

function onSignedOut() {
  // Don't leave one person's book sitting on a shared device.
  clearLiveState();
  // paintNotesCache is an app.js-level, per-paint on-demand cache (not a
  // KEYS/localStorage one) -- without this it'd keep serving whoever signs
  // in next the previous person's session-scoped fetch, notes RLS is
  // per-viewer so that's a real staleness bug, not just a cosmetic one.
  if (typeof resetPaintNotesCache === "function") resetPaintNotesCache();
  if (typeof resetCommentsCache === "function") resetCommentsCache();
  if (typeof resetProfileCache === "function") resetProfileCache();
  appBooted = false;
  if (typeof render === "function") render();
}

function clearLiveState() {
  save(KEYS.recipes, []);
  save(KEYS.paints, []);
  save(KEYS.wantToBuy, []);
  save(KEYS.sharedRecipes, []);
  save(KEYS.sharedPaints, []);
  save(KEYS.profiles, []);
  save(KEYS.myRatings, []);
  save(KEYS.ratingSummary, []);
  save(KEYS.activityFeed, {});
  save(KEYS.globalArt, {});
  localStorage.removeItem(SYNC_KEYS.lastSync);
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
    hex: p.hex, type: p.type, needs_restock: !!p.needsRestock,
    quantity: p.quantity == null ? 1 : p.quantity,
    updated_at: p.updatedAt, deleted: !!p.deleted,
  };
}

function fromRemotePaint(row) {
  return {
    id: row.id, name: row.name, brand: row.brand, hex: row.hex,
    type: row.type, needsRestock: !!row.needs_restock,
    quantity: row.quantity == null ? 1 : row.quantity,
    updatedAt: row.updated_at, deleted: !!row.deleted,
  };
}

function toRemoteWant(key, userId) {
  return { paint_key: key, user_id: userId };
}

function fromRemoteWant(row) {
  return { key: row.paint_key };
}

function toRemoteRating(paintKey, stars, userId) {
  return { paint_key: paintKey, user_id: userId, stars, updated_at: nowIso() };
}

function fromRemoteRating(row) {
  // userId is only meaningful for the activity feed (fetchActivityFeed
  // reads across every rater, not just the caller's own) -- harmless extra
  // field for the "my own ratings" callers, which already know it's theirs.
  return { paintKey: row.paint_key, stars: row.stars, updatedAt: row.updated_at, userId: row.user_id };
}

// A shared recipe keeps its author's id — it's a read-only view of someone
// else's row, never merged into the local book, so there's no local/remote
// timestamp reconciliation here, just a straight remote -> local mapping.
function fromRemoteSharedRecipe(row) {
  return {
    ...fromRemoteRecipe(row),
    authorId: row.user_id,
  };
}

function fromRemoteSharedPaint(row) {
  return { ...fromRemotePaint(row), authorId: row.user_id };
}

function defaultDisplayName(email) {
  return String(email || "Someone").split("@")[0];
}

// Every signed-in user needs exactly one row here so their name can show up
// on anything they share — created lazily on first sign-in rather than via a
// DB trigger, so it also backfills people invited before this feature shipped.
async function ensureProfile() {
  if (!sb || !isSignedIn()) return;
  const userId = session.user.id;
  try {
    let { data, error } = await sb.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) {
      // Signup collects a display name up front (see signUp) and it rides
      // in user_metadata until now, since there's no profiles row to hold it
      // until this first sign-in. The invite flow sets it directly via
      // updateDisplayName instead, so this call there is a same-value no-op.
      const displayName = (session.user.user_metadata && session.user.user_metadata.display_name) || defaultDisplayName(currentEmail());
      const { error: insErr } = await sb.from("profiles").insert({ user_id: userId, display_name: displayName });
      if (insErr) throw insErr;
      data = { user_id: userId, display_name: displayName };
    }
    // Cache locally too, so the recipe form's "share" toggle can show your
    // own name immediately rather than waiting on the next full sync.
    const profiles = readJSON(KEYS.profiles, []);
    const idx = profiles.findIndex((p) => p.userId === userId);
    const row = { userId, displayName: data.display_name, isAdmin: !!data.is_admin, avatarUrl: data.avatar_path ? avatarUrl(data.avatar_path) : null };
    if (idx === -1) profiles.push(row); else profiles[idx] = row;
    save(KEYS.profiles, profiles);
    if (typeof render === "function") render();
  } catch (e) {
    // Non-fatal — worst case, this account's shared recipes show a fallback
    // author name until the next successful sync tries again.
  }
}

async function updateDisplayName(name) {
  if (!sb || !isSignedIn()) return { ok: false, message: "No connection — try again when you're online." };
  const trimmed = String(name || "").trim();
  if (!trimmed) return { ok: false, message: "Enter a name first." };
  // A plain update, not upsert: upsert's generated ON CONFLICT DO UPDATE sets
  // every payload column, including user_id itself, and schema.sql only
  // grants UPDATE on (display_name, updated_at) — including user_id in the
  // payload made Postgres reject the whole statement with a 403. The row
  // always exists by the time this is reachable (ensureProfile creates it on
  // first sign-in), so there's no upsert-vs-update behavioural difference here.
  const { error } = await sb
    .from("profiles")
    .update({ display_name: trimmed, updated_at: nowIso() })
    .eq("user_id", session.user.id);
  if (error) return { ok: false, message: "Couldn't save that — try again." };
  // Merge, don't replace -- this profile's cached row may already carry
  // isAdmin/avatarUrl from ensureProfile, and a plain object replace here
  // would silently wipe both back to undefined.
  const profiles = readJSON(KEYS.profiles, []);
  const idx = profiles.findIndex((p) => p.userId === session.user.id);
  if (idx === -1) profiles.push({ userId: session.user.id, displayName: trimmed });
  else profiles[idx] = { ...profiles[idx], displayName: trimmed };
  save(KEYS.profiles, profiles);
  return { ok: true };
}

// Other people's published recipes: fetched read-only, cached separately from
// the local book, and never pushed anywhere. RLS scopes the paints query to
// exactly the paints those recipes' steps reference (see schema.sql), so this
// never pulls in someone else's whole rack.
async function fetchSharedRecipes(userId) {
  const { data: recipeRows, error: rErr } = await sb
    .from("recipes")
    .select("*")
    .eq("published", true)
    .eq("deleted", false)
    .neq("user_id", userId);
  if (rErr) throw rErr;

  const sharedRecipes = (recipeRows || []).map(fromRemoteSharedRecipe);
  const authorIds = [...new Set(sharedRecipes.map((r) => r.authorId))];

  let sharedPaints = [];
  let profiles = readJSON(KEYS.profiles, []);
  if (authorIds.length) {
    const [pRes, profRes] = await Promise.all([
      sb.from("paints").select("*").in("user_id", authorIds),
      sb.from("profiles").select("*").in("user_id", authorIds),
    ]);
    if (pRes.error) throw pRes.error;
    if (profRes.error) throw profRes.error;
    sharedPaints = (pRes.data || []).map(fromRemoteSharedPaint);

    (profRes.data || []).forEach((row) => {
      const found = profiles.find((p) => p.userId === row.user_id);
      const mapped = { userId: row.user_id, displayName: row.display_name, avatarUrl: row.avatar_path ? avatarUrl(row.avatar_path) : null };
      if (found) Object.assign(found, mapped); else profiles.push(mapped);
    });
  }

  save(KEYS.sharedRecipes, sharedRecipes);
  save(KEYS.sharedPaints, sharedPaints);
  save(KEYS.profiles, profiles);
}

// The Home activity feed's raw material — bounded, recency-ordered slices
// of comments/ratings/notes site-wide. Deliberately doesn't also re-fetch
// published recipes: fetchSharedRecipes above already pulls every published
// recipe unconditionally, so buildFeedItems() (js/app.js) derives its
// "recipe published" items from that existing cache instead of a second,
// redundant query against the same table.
async function fetchActivityFeed() {
  const [cRes, rRes, nRes] = await Promise.all([
    sb.from("recipe_comments").select("*").eq("status", "visible").eq("flagged", false).eq("deleted", false).order("created_at", { ascending: false }).limit(100),
    sb.from("paint_ratings").select("*").eq("deleted", false).order("updated_at", { ascending: false }).limit(100),
    sb.from("paint_notes").select("*").eq("status", "visible").eq("flagged", false).eq("deleted", false).order("created_at", { ascending: false }).limit(100),
  ]);
  if (cRes.error) throw cRes.error;
  if (rRes.error) throw rRes.error;
  if (nRes.error) throw nRes.error;

  // Any commenter/rater/note-author not already known from fetchSharedRecipes
  // (e.g. someone active only on paints, never publishing a recipe of their
  // own) needs their display name too, so the feed can show who did what.
  const comments = (cRes.data || []).map(fromRemoteComment);
  const ratings = (rRes.data || []).map(fromRemoteRating);
  const notes = (nRes.data || []).map(fromRemotePaintNote);
  const knownIds = new Set(readJSON(KEYS.profiles, []).map((p) => p.userId));
  const missingIds = [...new Set([...comments.map((c) => c.userId), ...ratings.map((r) => r.userId), ...notes.map((n) => n.userId)])].filter((id) => !knownIds.has(id));
  if (missingIds.length) {
    const { data } = await sb.from("profiles").select("user_id, display_name, avatar_path").in("user_id", missingIds);
    const profiles = readJSON(KEYS.profiles, []);
    (data || []).forEach((row) => profiles.push({ userId: row.user_id, displayName: row.display_name, avatarUrl: row.avatar_path ? avatarUrl(row.avatar_path) : null }));
    save(KEYS.profiles, profiles);
  }

  return { comments, ratings, notes };
}

// The public share page's one query — deliberately separate from
// fetchSharedRecipes above: this runs with no session at all (a stranger
// with no Forgebook account), scoped to exactly one recipe rather than
// every published recipe on the site, and never touches localStorage/KEYS
// since there's no "book" to speak of for a visitor who isn't signed in.
// RLS is what actually enforces "only if published" here — this only ever
// asks for one specific (authorId, id) pair, but a row simply won't come
// back if it isn't published (see schema.sql's "read published recipes").
async function fetchPublicRecipe(authorId, id) {
  if (!sb) return null;
  const { data: row, error: rErr } = await sb
    .from("recipes")
    .select("*")
    .eq("user_id", authorId)
    .eq("id", id)
    .maybeSingle();
  if (rErr || !row) return null;

  const recipe = fromRemoteSharedRecipe(row);

  const [pRes, profRes] = await Promise.all([
    sb.from("paints").select("*").eq("user_id", authorId),
    sb.from("profiles").select("display_name, avatar_path").eq("user_id", authorId).maybeSingle(),
  ]);
  const paints = (pRes.data || []).map(fromRemoteSharedPaint);
  const authorDisplayName = (profRes.data && profRes.data.display_name) || "Someone";
  const authorAvatarUrl = profRes.data && profRes.data.avatar_path ? avatarUrl(profRes.data.avatar_path) : null;

  return { recipe, paints, authorName: authorDisplayName, authorAvatarUrl };
}

// Reuses the exact same "read all profiles" RLS bar the app already relies
// on elsewhere: a signed-in caller matches any display name; a signed-out
// one only matches users with >=1 published recipe. No new policy needed —
// this is just a filtered query on top of that existing bar.
async function searchProfiles(query) {
  const q = String(query || "").trim();
  if (!sb || !q) return [];
  const { data, error } = await sb.from("profiles").select("user_id,display_name,avatar_path").ilike("display_name", `%${q}%`).limit(20);
  if (error) return [];
  return (data || []).map((row) => ({ userId: row.user_id, displayName: row.display_name, avatarUrl: row.avatar_path ? avatarUrl(row.avatar_path) : null }));
}

// A signed-in user's own profile page — recipes, notes, ratings, batched
// like fetchPublicRecipe already batches paints+profile.
async function fetchProfile(userId) {
  if (!sb) return null;
  const [profRes, recipesRes, notesRes, ratingsRes] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("recipes").select("*").eq("user_id", userId).eq("published", true).eq("deleted", false),
    sb.from("paint_notes").select("*").eq("user_id", userId).eq("deleted", false),
    sb.from("paint_ratings").select("*").eq("user_id", userId).eq("deleted", false),
  ]);
  if (!profRes.data) return null;
  return {
    userId,
    displayName: profRes.data.display_name,
    avatarUrl: profRes.data.avatar_path ? avatarUrl(profRes.data.avatar_path) : null,
    recipes: (recipesRes.data || []).map(fromRemoteRecipe),
    notes: (notesRes.data || []).map(fromRemotePaintNote),
    ratings: (ratingsRes.data || []).map(fromRemoteRating),
  };
}

// The signed-out variant — recipes only, deliberately narrower than
// fetchProfile above (mirrors fetchPublicRecipe's own narrow scope), so this
// route doesn't have to re-derive the hidden/pending-note visibility rules
// in a second, session-less code path.
async function fetchPublicProfile(userId) {
  if (!sb) return null;
  const [profRes, recipesRes] = await Promise.all([
    sb.from("profiles").select("display_name, avatar_path").eq("user_id", userId).maybeSingle(),
    sb.from("recipes").select("*").eq("user_id", userId).eq("published", true).eq("deleted", false),
  ]);
  if (!profRes.data) return null;
  return {
    userId,
    displayName: profRes.data.display_name,
    avatarUrl: profRes.data.avatar_path ? avatarUrl(profRes.data.avatar_path) : null,
    recipes: (recipesRes.data || []).map(fromRemoteRecipe),
  };
}

function photoUrl(path) {
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.photoBucket}/${path}`;
}

// A separate, fixed bucket (not CONFIG.photoBucket) so an avatar path can
// never collide with or be confused for a recipe photo path — see schema.sql.
function avatarUrl(path) {
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}`;
}

function factionEmblemUrl(path) {
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/faction-emblems/${path}`;
}

// Global, admin-uploaded emblem overrides — visible to every signed-in user,
// unlike the personal "Change emblem" override (KEYS.art), which stays on
// one device by design. Read-only for everyone but the admin; enforced
// server-side (see schema.sql), the isAdmin() checks here are just so the
// UI doesn't offer an action that would fail.
async function fetchGlobalFactionEmblems() {
  const { data, error } = await sb.from("faction_emblems").select("*");
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => { map[row.faction_id] = factionEmblemUrl(row.image_path); });
  save(KEYS.globalArt, map);
}

async function uploadGlobalFactionEmblem(factionId, dataUrl) {
  if (!sb || !isSignedIn()) return { ok: false, message: "No connection — try again when you're online." };
  if (!isAdmin()) return { ok: false, message: "Only the admin account can update this for everyone." };
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${factionId}-${Date.now().toString(36)}.jpg`;
    const { error: upErr } = await sb.storage
      .from("faction-emblems")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (upErr) throw upErr;
    const { error: dbErr } = await sb.from("faction_emblems").upsert({
      faction_id: factionId,
      image_path: path,
      updated_at: nowIso(),
      updated_by: session.user.id,
    });
    if (dbErr) throw dbErr;
    const map = readJSON(KEYS.globalArt, {});
    map[factionId] = factionEmblemUrl(path);
    save(KEYS.globalArt, map);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: "Couldn't upload that — try again." };
  }
}

async function removeGlobalFactionEmblem(factionId) {
  if (!sb || !isSignedIn() || !isAdmin()) return { ok: false };
  try {
    const { error } = await sb.from("faction_emblems").delete().eq("faction_id", factionId);
    if (error) throw error;
    const map = readJSON(KEYS.globalArt, {});
    delete map[factionId];
    save(KEYS.globalArt, map);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: "Couldn't remove that — try again." };
  }
}

// Upload a recipe photo straight to storage at save time (rather than
// lazily, in the background, as before) — under a live model there's no
// later step to defer it to.
async function uploadRecipePhoto(dataUrl, userId, recipeId) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/${recipeId}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await sb.storage
    .from(CONFIG.photoBucket)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return path;
}

// Uploads to storage, then points profiles.avatar_path at the new file —
// the old file (if any) is just left orphaned in the bucket rather than
// deleted, same tradeoff uploadRecipePhoto already makes for photo swaps.
async function uploadAvatar(dataUrl, userId) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/avatar-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error: upErr } = await sb.storage
    .from("avatar-photos")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (upErr) throw upErr;
  const { error: dbErr } = await sb.from("profiles").update({ avatar_path: path, updated_at: nowIso() }).eq("user_id", userId);
  if (dbErr) throw dbErr;
  return path;
}

// Fetches this account's whole book fresh from Supabase and replaces the
// local render cache outright. There's nothing to merge or reconcile —
// the cloud is the only copy of the data that exists.
async function loadBook() {
  if (!sb || !isSignedIn()) return { ok: false };
  syncing = true;
  if (typeof render === "function") render();

  const userId = session.user.id;
  let ok = true;

  try {
    const [rRes, pRes] = await Promise.all([
      sb.from("recipes").select("*").eq("user_id", userId).eq("deleted", false),
      sb.from("paints").select("*").eq("user_id", userId).eq("deleted", false),
    ]);
    if (rRes.error) throw rRes.error;
    if (pRes.error) throw pRes.error;
    save(KEYS.recipes, (rRes.data || []).map(fromRemoteRecipe));
    save(KEYS.paints, (pRes.data || []).map(fromRemotePaint));
    localStorage.setItem(SYNC_KEYS.lastSync, nowIso());
    cloudError = null;
  } catch (e) {
    ok = false;
    cloudError = "sync";
  }

  // Deliberately isolated from the block above: paint_wants is a newer,
  // optional table. Until someone re-runs schema.sql to add it, this fails
  // quietly and the want-list just stays empty — it doesn't take the
  // recipes/paints load (the thing that actually matters) down with it.
  try {
    const { data, error } = await sb.from("paint_wants").select("*").eq("user_id", userId).eq("deleted", false);
    if (error) throw error;
    save(KEYS.wantToBuy, (data || []).map(fromRemoteWant));
  } catch (e) {
    // swallowed on purpose — see comment above
  }

  // Same deliberate isolation: someone else's shared recipes are a nice-to-have,
  // not the reason this app exists. A stale/missing profiles table (schema.sql
  // not yet re-run) shouldn't block anything above.
  try {
    await fetchSharedRecipes(userId);
  } catch (e) {
    // swallowed on purpose
  }

  // Same deliberate isolation: a rating badge that hasn't loaded yet is a
  // cosmetic gap, not a broken app.
  try {
    save(KEYS.myRatings, await fetchMyRatings());
  } catch (e) {
    // swallowed on purpose
  }

  try {
    save(KEYS.ratingSummary, await fetchRatingSummary());
  } catch (e) {
    // swallowed on purpose
  }

  // Same deliberate isolation: a stale/empty activity feed just means Home
  // shows less, not that the load failed. Runs after fetchSharedRecipes
  // above so its profile cache is already warm for most feed authors.
  try {
    save(KEYS.activityFeed, await fetchActivityFeed());
  } catch (e) {
    // swallowed on purpose
  }

  try {
    await fetchGlobalFactionEmblems();
  } catch (e) {
    // swallowed on purpose — a missing faction_emblems table just means
    // no admin-uploaded emblems show up yet, not a broken load
  }

  syncing = false;
  if (typeof render === "function") render();
  return { ok };
}

// Direct, live writes — no queue, no background retry. If one of these
// fails, the local cache is left exactly as it was; the caller is
// responsible for telling the person their change didn't save.
async function pushRecipe(row) {
  if (!sb || !isSignedIn()) return { ok: false, message: "No connection — try again when you're online." };
  const { error } = await sb.from("recipes").upsert(toRemoteRecipe(row, session.user.id));
  if (error) return { ok: false, message: "Couldn't save that — try again." };
  return { ok: true };
}

async function deleteRecipeRemote(id) {
  if (!sb || !isSignedIn()) return { ok: false, message: "No connection — try again when you're online." };
  const { error } = await sb.from("recipes").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return { ok: false, message: "Couldn't delete that — try again." };
  return { ok: true };
}

async function pushPaint(row) {
  if (!sb || !isSignedIn()) return { ok: false, message: "No connection — try again when you're online." };
  const { error } = await sb.from("paints").upsert(toRemotePaint(row, session.user.id));
  if (error) return { ok: false, message: "Couldn't save that — try again." };
  return { ok: true };
}

async function deletePaintRemote(id) {
  if (!sb || !isSignedIn()) return { ok: false, message: "No connection — try again when you're online." };
  const { error } = await sb.from("paints").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return { ok: false, message: "Couldn't delete that — try again." };
  return { ok: true };
}

async function pushWant(key) {
  if (!sb || !isSignedIn()) return { ok: false };
  const { error } = await sb.from("paint_wants").upsert(toRemoteWant(key, session.user.id));
  return { ok: !error };
}

async function removeWantRemote(key) {
  if (!sb || !isSignedIn()) return { ok: false };
  const { error } = await sb.from("paint_wants").delete().eq("user_id", session.user.id).eq("paint_key", key);
  return { ok: !error };
}

// One rating per user per paint — upsert covers both "rate for the first
// time" and "change your rating" the same way pushWant covers add/re-add.
async function pushRating(paintKey, stars) {
  if (!sb || !isSignedIn()) return { ok: false, message: "Sign in to rate paints." };
  const { error } = await sb.from("paint_ratings").upsert(toRemoteRating(paintKey, stars, session.user.id));
  if (error) return { ok: false, message: "Couldn't save that rating — try again." };
  return { ok: true };
}

async function removeRatingRemote(paintKey) {
  if (!sb || !isSignedIn()) return { ok: false };
  const { error } = await sb.from("paint_ratings").delete().eq("user_id", session.user.id).eq("paint_key", paintKey);
  return { ok: !error };
}

// The signed-in user's own ratings, for "your rating: X" display.
async function fetchMyRatings() {
  if (!sb || !isSignedIn()) return [];
  const { data, error } = await sb.from("paint_ratings").select("*").eq("user_id", session.user.id).eq("deleted", false);
  if (error) throw error;
  return (data || []).map(fromRemoteRating);
}

// Site-wide avg+count per paint_key, one call instead of ~2000 individual
// queries across PAINT_LIBRARY (see paint_rating_summary in schema.sql).
async function fetchRatingSummary() {
  if (!sb) return [];
  const { data, error } = await sb.from("paint_rating_summary").select("*");
  if (error) throw error;
  return (data || []).map((row) => ({ paintKey: row.paint_key, avgStars: row.avg_stars, ratingCount: row.rating_count }));
}

function toRemotePaintNote(n, userId) {
  return { id: n.id, paint_key: n.paintKey, user_id: userId, body: n.body, flagged: !!n.flagged, updated_at: nowIso() };
}

function fromRemotePaintNote(row) {
  return {
    id: row.id, paintKey: row.paint_key, userId: row.user_id, body: row.body,
    flagged: !!row.flagged, status: row.status, createdAt: row.created_at,
    updatedAt: row.updated_at, deleted: !!row.deleted,
  };
}

// Anyone can read a paint's notes (RLS already hides reported-past-threshold
// rows for everyone but the author/an admin), so this works whether or not
// the visitor is signed in.
async function fetchPaintNotes(paintKey) {
  if (!sb) return [];
  const { data, error } = await sb.from("paint_notes").select("*").eq("paint_key", paintKey).eq("deleted", false).order("created_at");
  if (error) throw error;
  return (data || []).map(fromRemotePaintNote);
}

// Runs the client-side profanity filter before the write (see
// containsBlockedContent in moderation.js) — a hit sets `flagged` rather
// than blocking the submit, so a false positive still posts, just hidden-
// pending like an auto-reported note would.
async function pushPaintNote(paintKey, body) {
  if (!sb || !isSignedIn()) return { ok: false, message: "Sign in to leave a note." };
  const note = { id: crypto.randomUUID(), paintKey, body, flagged: containsBlockedContent(body) };
  const { error } = await sb.from("paint_notes").insert(toRemotePaintNote(note, session.user.id));
  if (error) return { ok: false, message: "Couldn't post that note — try again." };
  return { ok: true, note };
}

async function removePaintNoteRemote(id) {
  if (!sb || !isSignedIn()) return { ok: false };
  const { error } = await sb.from("paint_notes").update({ deleted: true, updated_at: nowIso() }).eq("id", id).eq("user_id", session.user.id);
  return { ok: !error };
}

// Shared by paint notes and recipe comments. A unique-violation means this
// person already reported this exact item — treat that as a soft success
// ("thanks, already noted") rather than surfacing a raw DB error.
async function reportContent(contentType, contentId, reason) {
  if (!sb || !isSignedIn()) return { ok: false, message: "Sign in to report content." };
  const { error } = await sb.from("reports").insert({
    content_type: contentType, content_id: contentId, reporter_id: session.user.id, reason: reason || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: true, alreadyReported: true };
    return { ok: false, message: "Couldn't send that report — try again." };
  }
  return { ok: true };
}

function toRemoteComment(c, userId) {
  return { id: c.id, recipe_owner_id: c.recipeOwnerId, recipe_id: c.recipeId, user_id: userId, body: c.body, flagged: !!c.flagged, updated_at: nowIso() };
}

function fromRemoteComment(row) {
  return {
    id: row.id, recipeOwnerId: row.recipe_owner_id, recipeId: row.recipe_id, userId: row.user_id,
    body: row.body, edited: !!row.edited, flagged: !!row.flagged, status: row.status,
    createdAt: row.created_at, updatedAt: row.updated_at, deleted: !!row.deleted,
  };
}

// Works signed-out too (the public share page has its own read of this),
// since RLS gates visibility by the recipe's own published/deleted flags,
// not by whether the caller has a session.
async function fetchComments(ownerId, recipeId) {
  if (!sb) return [];
  const { data, error } = await sb.from("recipe_comments").select("*").eq("recipe_owner_id", ownerId).eq("recipe_id", recipeId).eq("deleted", false).order("created_at");
  if (error) throw error;
  return (data || []).map(fromRemoteComment);
}

async function submitCommentRemote(ownerId, recipeId, body) {
  if (!sb || !isSignedIn()) return { ok: false, message: "Sign in to comment." };
  const comment = { id: crypto.randomUUID(), recipeOwnerId: ownerId, recipeId, body, flagged: containsBlockedContent(body) };
  const { error } = await sb.from("recipe_comments").insert(toRemoteComment(comment, session.user.id));
  if (error) return { ok: false, message: "Couldn't post that comment — try again." };
  return { ok: true, comment };
}

async function editCommentRemote(id, body) {
  if (!sb || !isSignedIn()) return { ok: false, message: "Sign in to edit comments." };
  const { error } = await sb.from("recipe_comments")
    .update({ body, edited: true, flagged: containsBlockedContent(body), updated_at: nowIso() })
    .eq("id", id).eq("user_id", session.user.id);
  if (error) return { ok: false, message: "Couldn't save that edit — try again." };
  return { ok: true };
}

async function removeCommentRemote(id) {
  if (!sb || !isSignedIn()) return { ok: false };
  const { error } = await sb.from("recipe_comments").update({ deleted: true, updated_at: nowIso() }).eq("id", id).eq("user_id", session.user.id);
  return { ok: !error };
}

function syncStatusLabel() {
  if (!isSignedIn()) return null;
  if (syncing) return "Loading…";
  if (cloudError === "sync") return "Couldn't load — try again";
  const t = lastSyncedAt();
  if (!t) return "Not loaded yet";
  const mins = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  if (mins < 1) return "Loaded just now";
  if (mins < 60) return `Loaded ${mins} min ago`;
  return "Loaded " + new Date(t).toLocaleDateString();
}


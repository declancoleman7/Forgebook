// A client-side gate on freeform user text (paint notes, recipe comments) --
// there is no server/edge-function layer in this app, so this runs before
// every write. A hit doesn't block the submit outright: it just sets the
// row's `flagged` column, so a false positive starts hidden-pending exactly
// like an auto-reported item would (see the paint_notes/recipe_comments RLS
// in supabase/schema.sql), rather than silently eating someone's post.
//
// This is a lightweight first line of defence, not the real backstop --
// community reporting (also in schema.sql) is what actually removes content
// that slips past this. Keep the list short and easy to extend rather than
// trying to make it exhaustive.

const MODERATION_BLOCKLIST = [
  "fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "fag",
  "retard", "whore", "slut", "rape", "kike", "spic", "chink", "tranny",
];

// Normalizes per WORD (splitting on whitespace first) rather than across the
// whole string, so stripping punctuation can't accidentally merge two
// separate innocent words into one that matches a blocklist entry (e.g. "I
// bit chocolate" must never become "bitchocolate"). Within a single word,
// this still catches common evasions: leetspeak substitution, stray
// punctuation used as a separator ("f.u.c.k"), and repeated characters
// ("fuuuuck").
function normalizeWordForModeration(word) {
  return word
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/\$/g, "s")
    .replace(/@/g, "a")
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");
}

function containsBlockedContent(text) {
  const words = String(text || "").split(/\s+/).map(normalizeWordForModeration);
  return words.some((w) => w && MODERATION_BLOCKLIST.some((blocked) => w.includes(blocked)));
}

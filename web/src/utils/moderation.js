// A client-side gate on freeform user text -- not the real backstop
// (community reporting + admin review is), just a lightweight first line
// of defence, matching this app's own stated posture ("a small, self-run
// hobby project, not a professional security service"). For comments and
// paint notes, a hit sets the row's `flagged` column (hidden pending
// review, never blocked outright). Everywhere else a user types free text
// that others see immediately -- recipe names/notes, hobby log/project
// titles, a custom paint name, a display name -- there's no flagged/
// hidden-pending-review column to fall back on, so a hit blocks the save
// outright instead, with an inline error, same as this app's other "fix
// this before you can submit" validation.
const MODERATION_BLOCKLIST = [
  // Profanity
  'fuck', 'shit', 'bitch', 'cunt', 'bastard', 'asshole', 'dick', 'piss',
  'crap', 'bollocks', 'wanker', 'twat', 'bugger', 'arse', 'goddamn', 'douchebag',
  // Sexual
  'porn', 'pornography', 'rape', 'rapist', 'molest', 'pedophile', 'paedophile',
  'incest', 'bestiality', 'blowjob', 'handjob', 'cum', 'jizz', 'dildo',
  'masturbate', 'orgasm', 'clit', 'vagina', 'penis', 'nude', 'nudes',
  // Slurs -- racial/ethnic
  'nigger', 'nigga', 'chink', 'gook', 'spic', 'wetback', 'beaner', 'kike',
  'paki', 'raghead', 'towelhead', 'cracker', 'gringo', 'coon', 'jap',
  // Slurs -- homophobic/transphobic
  'faggot', 'fag', 'dyke', 'tranny', 'shemale',
  // Slurs -- ableist
  'retard', 'retarded', 'spastic', 'spaz', 'cripple', 'mongoloid',
  // Misogynistic
  'whore', 'slut', 'skank', 'thot',
  // Violence / hate
  'nazi', 'hitler', 'kys', 'terrorist', 'lynch',
];

// Common lookalike characters used to dodge a naive filter -- mostly
// Cyrillic and Greek letters that render near-identically to Latin ones in
// most fonts. Mapped to their Latin equivalent before anything else runs,
// so "ѕhit" (Cyrillic ѕ) normalizes the same as "shit".
const HOMOGLYPHS = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x', // Cyrillic
  і: 'i', ѕ: 's', ԁ: 'd', ո: 'n', ѡ: 'w',
  α: 'a', ο: 'o', ρ: 'p', υ: 'u', // Greek
};

function replaceHomoglyphs(text) {
  return String(text).split('').map((ch) => HOMOGLYPHS[ch] || ch).join('');
}

function normalizeWordForModeration(word) {
  return replaceHomoglyphs(word)
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/\$/g, 's').replace(/@/g, 'a')
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1');
}

export function containsBlockedContent(text) {
  const raw = String(text || '');
  // Word-by-word: word-boundary aware, lower false-positive risk for the
  // ordinary case (someone typing a blocked word as its own word).
  const words = raw.split(/\s+/).map(normalizeWordForModeration);
  if (words.some((w) => w && MODERATION_BLOCKLIST.some((blocked) => w.includes(blocked)))) return true;
  // Whole-text: catches spacing/punctuation used to dodge the word-by-word
  // check above ("f u c k", "f.u.c.k") by stripping ALL non-letters across
  // the entire input at once, not just within each already-split word.
  // Higher false-positive risk (the "Scunthorpe problem" -- an innocent
  // word that happens to contain a blocked substring, e.g. "Scunthorpe"
  // itself contains "cunt") already existed with the word-by-word check;
  // this doesn't meaningfully change that trade-off, just closes the
  // spacing bypass.
  const collapsed = normalizeWordForModeration(raw);
  return MODERATION_BLOCKLIST.some((blocked) => collapsed.includes(blocked));
}

// A client-side gate on freeform user text -- ported as-is from
// js/moderation.js. Not the real backstop (community reporting is), just a
// lightweight first line of defence; a hit sets the row's `flagged` column
// rather than blocking the submit outright.
const MODERATION_BLOCKLIST = [
  'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'whore', 'slut', 'rape', 'kike', 'spic', 'chink', 'tranny',
];

function normalizeWordForModeration(word) {
  return word
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/\$/g, 's').replace(/@/g, 'a')
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1');
}

export function containsBlockedContent(text) {
  const words = String(text || '').split(/\s+/).map(normalizeWordForModeration);
  return words.some((w) => w && MODERATION_BLOCKLIST.some((blocked) => w.includes(blocked)));
}

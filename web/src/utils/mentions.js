// Ported from the old app's detectMentionTrigger()/highlightMentions().

// Finds an "@" that starts right where the cursor is typing (preceded by
// start-of-text or whitespace, so "name@example.com" doesn't trigger this),
// returning where it starts and what's been typed after it so far.
export function detectMentionTrigger(text, cursorPos) {
  const upToCursor = text.slice(0, cursorPos);
  const match = upToCursor.match(/(?:^|\s)@([^\s@]*)$/);
  if (!match) return null;
  return { start: cursorPos - match[1].length - 1, query: match[1] };
}

// Longest-display-name-first, boundary-checked match -- mirrors the
// server-side mentioned_profile_ids() algorithm (schema.sql) so a
// highlighted mention matches exactly who actually got notified. Returns
// an array of {text, profile} segments -- profile is null for plain text,
// or {userId, displayName} for a matched mention. A name not in `profiles`
// (someone never seen via this thread/search) simply won't be highlighted
// -- a graceful miss, not a wrong render.
export function splitMentions(text, profiles) {
  const named = profiles.filter((p) => p.displayName).sort((a, b) => b.displayName.length - a.displayName.length);
  if (!named.length) return [{ text, profile: null }];

  const segments = [];
  let plainStart = 0;
  let i = 0;
  while (i < text.length) {
    if (text[i] === '@') {
      let matched = null;
      for (const p of named) {
        const name = p.displayName;
        const candidate = text.slice(i + 1, i + 1 + name.length);
        if (candidate.toLowerCase() === name.toLowerCase()) {
          const boundary = text[i + 1 + name.length];
          if (!boundary || !/[a-zA-Z0-9_]/.test(boundary)) { matched = p; break; }
        }
      }
      if (matched) {
        if (i > plainStart) segments.push({ text: text.slice(plainStart, i), profile: null });
        segments.push({ text: `@${matched.displayName}`, profile: matched });
        i += 1 + matched.displayName.length;
        plainStart = i;
        continue;
      }
    }
    i++;
  }
  if (plainStart < text.length) segments.push({ text: text.slice(plainStart), profile: null });
  return segments;
}

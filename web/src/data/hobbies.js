// Minimal slice of js/data.js's HOBBIES for now -- just enough for the
// Settings "add a hobby" list. Stage 3's Collection/Armies browse page will
// need the full { factions, systems, browseTitle, ... } shape too; this
// file is where that gets filled in when that page is built, not
// duplicated elsewhere.
export const HOBBIES = [
  { id: 'warhammer', label: 'Warhammer' },
  { id: 'dnd', label: 'D&D Miniatures' },
];

export function hobby(id) {
  return HOBBIES.find((h) => h.id === id) || HOBBIES[0];
}

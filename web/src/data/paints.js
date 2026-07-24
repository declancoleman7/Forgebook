import PAINT_LIBRARY from './paintLibrary.json';

export { PAINT_LIBRARY };

export const TECHNIQUES = ['Primer', 'Base', 'Shade', 'Layer', 'Highlight', 'Edge Highlight', 'Glaze', 'Drybrush', 'Wash', 'Contrast', 'Technical'];
// Derived from PAINT_LIBRARY itself (plus a trailing "Other" catch-all) so
// a custom paint's own type/brand dropdown can never drift out of sync with
// what the library actually contains again -- this used to be a hand-typed
// list of ~9 generic types/10 brands, while the library alone has 64 real
// type strings (e.g. "Speedpaint 2.0", "Pro Acryl Standard (Metallics)")
// and includes Humbrol/Tamiya, neither of which was even in the old list.
export const PAINT_TYPES = [...new Set(PAINT_LIBRARY.map((p) => p.type))].sort().concat('Other');
export const PAINT_BRANDS = [...new Set(PAINT_LIBRARY.map((p) => p.brand))].sort().concat('Other');
export const PAINT_CATEGORY_LABEL = { base: 'Base/Layer', wash: 'Wash', contrast: 'Contrast/Speedpaint', metallic: 'Metallic', primer: 'Primer/Spray' };

export function paintKey(name, brand) {
  return String(name || '').trim().toLowerCase() + '|' + String(brand || '').trim().toLowerCase();
}

// Like paintKey(), but also disambiguates PAINT_LIBRARY's ~30 name+brand
// pairs that come in more than one type (e.g. "Death Guard Green" as both a
// Citadel Base and a Citadel Spray) -- only for RACK OWNERSHIP matching.
// paintKey() alone stays the identity for ratings/notes/saved-paints, which
// have no type dimension server-side and must keep matching every variant.
export function paintTypeKey(name, brand, type) {
  return paintKey(name, brand) + '|' + String(type || '').trim().toLowerCase();
}

// A paint_wants row with type === '' predates the type column and is a
// legacy "wants any type of this paint" entry -- it matches every variant
// until the user re-toggles a specific one, same as the pre-migration
// behaviour. A row with a real type only matches that exact variant.
export function isWanted(wantedList, name, brand, type) {
  const key = paintKey(name, brand);
  return (wantedList || []).some((w) => w.paintKey === key && (w.type === '' || w.type === (type || '')));
}

export function paintCategory(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('wash') || t.includes('shade')) return 'wash';
  if (t.includes('contrast') || t.includes('speedpaint')) return 'contrast';
  if (t.includes('metal')) return 'metallic';
  if (t.includes('primer') || t.includes('spray')) return 'primer';
  return 'base';
}

export function paintMatchesQuery(p, q) {
  return p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.type || '').toLowerCase().includes(q);
}

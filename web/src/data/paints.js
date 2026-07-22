export { default as PAINT_LIBRARY } from './paintLibrary.json';

export const TECHNIQUES = ['Primer', 'Base', 'Shade', 'Layer', 'Highlight', 'Edge Highlight', 'Glaze', 'Drybrush', 'Wash', 'Contrast', 'Technical'];
export const PAINT_TYPES = ['Base', 'Layer', 'Shade', 'Contrast', 'Dry', 'Technical', 'Air', 'Spray', 'Other'];
export const PAINT_BRANDS = ['Citadel', 'Vallejo', 'Army Painter', 'Scale75', 'Pro Acryl', 'Two Thin Coats', 'AK', 'Kimera', 'Colour Forge', 'Other'];
export const PAINT_CATEGORY_LABEL = { base: 'Base/Layer', wash: 'Wash', contrast: 'Contrast/Speedpaint', metallic: 'Metallic', primer: 'Primer/Spray' };

export function paintKey(name, brand) {
  return String(name || '').trim().toLowerCase() + '|' + String(brand || '').trim().toLowerCase();
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

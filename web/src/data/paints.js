export { default as PAINT_LIBRARY } from './paintLibrary.json';

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
  return p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
}

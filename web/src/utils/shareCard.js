import { hexToRgb } from './colour.js';
import { emblemPaths } from '../data/factions.js';
import { estimatedMinutes, formatDuration } from './format.js';

// Share card — a portrait (1080x1350, the safe Instagram feed crop) PNG
// summarising a recipe, generated client-side on a canvas and handed to the
// Web Share API (or downloaded, where that's unavailable) -- see
// RecipeDetail.jsx's onShare(). Deliberately not a screenshot of any in-app
// view: social platforms recompress/crop shared images unpredictably, so
// this is drawn at a fixed size built for that, rather than reusing the
// responsive HTML layout. Ported straight from the pre-React app's own
// drawShareCardCanvas() -- same fixed system-font fallback stack as before
// (not the app's real Cinzel/Inter/IBM Plex Mono webfonts), since canvas
// text needs those fonts already loaded before the first draw, and this
// stays a faithful restore rather than a redesign.
function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const attempt = line ? line + ' ' + w : w;
    if (ctx.measureText(attempt).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = attempt;
    }
  });
  if (line) lines.push(line);
  return lines;
}

// Plain solid-dot difficulty text for canvas (no HTML spans available there).
function difficultyDotsText(level, max = 5) {
  let out = '';
  for (let i = 1; i <= max; i++) out += i <= level ? '●' : '○';
  return out;
}

const FONT_DISPLAY = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif';
const FONT_BODY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FONT_MONO = 'ui-monospace, "SF Mono", "Cascadia Code", "Segoe UI Mono", Consolas, "Liberation Mono", monospace';

// usedPaints: paints resolved from the recipe's steps ({name, hex, ...}).
// steps: pre-resolved to {technique, paintName, hex} by the caller -- this
// function only draws, it doesn't know how to resolve a step's paint from a
// rack/id (that's RecipeDetail's own resolveStepPaint).
export function drawShareCardCanvas(r, f, usedPaints, steps) {
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const pad = 80;

  // --- Background: graphite ground + a faction-coloured glow, same idea as
  // the app's own dark theme but fixed values (no CSS variables in canvas). ---
  ctx.fillStyle = '#14171a';
  ctx.fillRect(0, 0, W, H);
  const { r: fr, g: fg, b: fb } = hexToRgb(f.color);
  const glow = ctx.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, W * 0.75);
  glow.addColorStop(0, `rgba(${fr},${fg},${fb},0.35)`);
  glow.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const gold = '#dcae67';
  const parchment = '#e9e3d4';
  const parchmentDim = '#c2bcaa';
  const ink = '#9c9587';
  const line = 'rgba(255,255,255,0.08)';

  let y = pad + 10;

  // --- Faction row: emblem + label ---
  ctx.save();
  ctx.translate(pad, y - 28);
  ctx.fillStyle = f.color;
  ctx.scale(1.4, 1.4);
  // emblemPaths() returns SVG markup (<path d="...">), not raw path data --
  // Path2D only accepts the latter, so each d="..." attribute is pulled out
  // and filled as its own subpath.
  const emblemDs = emblemPaths(f.emblem).match(/d="([^"]+)"/g) || [];
  emblemDs.forEach((m) => {
    const d = m.slice(3, -1);
    try { ctx.fill(new Path2D(d)); } catch { /* malformed path data -- skip that subpath */ }
  });
  ctx.restore();
  ctx.fillStyle = f.color;
  ctx.font = '600 30px ' + FONT_MONO;
  ctx.textBaseline = 'middle';
  ctx.fillText(f.label.toUpperCase(), pad + 56, y);
  y += 70;

  // --- Title (up to 2 lines) ---
  ctx.fillStyle = parchment;
  ctx.font = '600 72px ' + FONT_DISPLAY;
  ctx.textBaseline = 'alphabetic';
  const titleLines = wrapCanvasText(ctx, r.name, W - pad * 2).slice(0, 2);
  titleLines.forEach((l) => { y += 74; ctx.fillText(l, pad, y); });
  y += 20;

  // --- Subtitle ---
  ctx.fillStyle = ink;
  ctx.font = '30px ' + FONT_BODY;
  y += 38;
  ctx.fillText(`${r.unit || 'General'} · Made with Forgebook`, pad, y);
  y += 44;

  // --- Meta row (difficulty / steps / est. time) ---
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  const metaY = y + 56;
  const cellW = (W - pad * 2) / 3;
  const metas = [
    [difficultyDotsText(r.difficulty || 1), 'DIFFICULTY'],
    [String(steps.length), 'STEPS'],
    [formatDuration(estimatedMinutes(r)), 'EST. TIME'],
  ];
  metas.forEach(([val, label], i) => {
    const cx = pad + cellW * i + cellW / 2;
    ctx.fillStyle = parchment;
    ctx.font = '600 34px ' + FONT_MONO;
    ctx.textAlign = 'center';
    ctx.fillText(val, cx, metaY);
    ctx.fillStyle = ink;
    ctx.font = '22px ' + FONT_MONO;
    ctx.fillText(label, cx, metaY + 34);
  });
  ctx.textAlign = 'left';
  y = metaY + 66;
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  y += 54;

  // --- Paints: swatches + name, capped with an overflow chip. Fixed
  // six-column grid (five swatches + an overflow chip once there's more
  // than six paints) so labels always get the same width to wrap into,
  // rather than however much space happens to be left. ---
  ctx.fillStyle = gold;
  ctx.font = '600 24px ' + FONT_MONO;
  ctx.fillText('PAINTS', pad, y);
  y += 50;
  const TOTAL_SLOTS = 6;
  const needsOverflow = usedPaints.length > TOTAL_SLOTS;
  const shown = usedPaints.slice(0, needsOverflow ? TOTAL_SLOTS - 1 : TOTAL_SLOTS);
  const overflow = usedPaints.length - shown.length;
  const colW = (W - pad * 2) / TOTAL_SLOTS;
  const swatchR = 42;
  const labelMaxWidth = colW - 14;
  shown.forEach((p, i) => {
    const cx = pad + colW * i + colW / 2;
    const cy = y + swatchR;
    ctx.beginPath();
    ctx.arc(cx, cy, swatchR, 0, Math.PI * 2);
    ctx.fillStyle = p.hex;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = '17px ' + FONT_MONO;
    ctx.textAlign = 'center';
    const labelLines = wrapCanvasText(ctx, p.name, labelMaxWidth).slice(0, 2);
    labelLines.forEach((l, li) => ctx.fillText(l, cx, cy + swatchR + 26 + li * 20));
  });
  if (overflow > 0) {
    const cx = pad + colW * shown.length + colW / 2;
    const cy = y + swatchR;
    ctx.beginPath();
    ctx.arc(cx, cy, swatchR, 0, Math.PI * 2);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ink;
    ctx.font = '26px ' + FONT_MONO;
    ctx.textAlign = 'center';
    ctx.fillText('+' + overflow, cx, cy + 8);
  }
  ctx.textAlign = 'left';
  y += swatchR * 2 + 66;

  // --- Steps: first few, condensed ---
  ctx.fillStyle = gold;
  ctx.font = '600 24px ' + FONT_MONO;
  ctx.fillText("HOW IT'S BUILT", pad, y);
  y += 50;
  const MAX_STEPS = 3;
  steps.slice(0, MAX_STEPS).forEach((s) => {
    ctx.beginPath();
    ctx.arc(pad + 10, y - 9, 10, 0, Math.PI * 2);
    ctx.fillStyle = s.hex || f.color;
    ctx.fill();
    ctx.fillStyle = parchmentDim;
    ctx.font = '30px ' + FONT_BODY;
    ctx.fillText(s.technique, pad + 34, y);
    const techW = ctx.measureText(s.technique + ' ').width;
    ctx.font = '700 30px ' + FONT_BODY;
    ctx.fillStyle = parchment;
    ctx.fillText(s.paintName, pad + 34 + techW, y);
    y += 46;
  });
  if (steps.length > MAX_STEPS) {
    ctx.fillStyle = ink;
    ctx.font = '24px ' + FONT_MONO;
    ctx.fillText(`+ ${steps.length - MAX_STEPS} more steps in the app`, pad + 34, y);
    y += 20;
  }

  // --- Footer ---
  const footerY = H - pad + 4;
  ctx.strokeStyle = line;
  ctx.beginPath(); ctx.moveTo(pad, footerY - 44); ctx.lineTo(W - pad, footerY - 44); ctx.stroke();
  ctx.fillStyle = gold;
  ctx.font = '600 34px ' + FONT_DISPLAY;
  ctx.textAlign = 'left';
  ctx.fillText('Forgebook', pad, footerY);
  ctx.fillStyle = ink;
  ctx.font = '24px ' + FONT_MONO;
  ctx.textAlign = 'right';
  ctx.fillText('forgebook.co.uk', W - pad, footerY);
  ctx.textAlign = 'left';

  return canvas;
}

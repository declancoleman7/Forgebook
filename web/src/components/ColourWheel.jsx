import { useEffect, useRef } from 'react';
import { hexToHsv, hsvToHex } from '../utils/colour.js';

// A hue/saturation wheel (drag to pick) -- originally built for Similar
// Colours' free-standing colour picker, now shared with PaintForm's custom-
// paint hex field too. Self-contained: no dependency on either page's own
// state beyond the hex/onChange/onCommit props.
export default function ColourWheel({ hex, onChange, onCommit }) {
  const canvasRef = useRef(null);
  const draggingRef = useRef(false);
  // pointermove can fire far more often than the screen actually repaints
  // (well past 60/s on some mice/tablets), and each call recomputes
  // colour-matches over the full ~2000-entry paint library plus re-renders
  // every result row -- unthrottled, a fast/sustained drag queues up far
  // more of that work than any frame can use, and it compounds across
  // repeated drags in one session. Capping to one update per animation
  // frame keeps dragging visually identical while cutting out the calls
  // that were never going to reach the screen anyway.
  const rafRef = useRef(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, radius = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const conic = ctx.createConicGradient(-Math.PI / 2, cx, cy);
    for (let i = 0; i <= 360; i += 15) conic.addColorStop(i / 360, hsvToHex(i, 1, 1));
    ctx.fillStyle = conic;
    ctx.fillRect(0, 0, size, size);
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    radial.addColorStop(0, 'rgba(255,255,255,1)');
    radial.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }, []); // the wheel gradient itself is static -- only drawn once

  const wheel = hexToHsv(hex);
  const R = 90;
  const angle = (wheel.h / 360) * Math.PI * 2;
  const dist = wheel.s * R;
  const indicatorLeft = ((R + dist * Math.sin(angle)) / (R * 2)) * 100;
  const indicatorTop = ((R - dist * Math.cos(angle)) / (R * 2)) * 100;

  const updateFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scale - R;
    const y = (e.clientY - rect.top) * scale - R;
    const dist = Math.sqrt(x * x + y * y);
    let a = Math.atan2(x, -y);
    if (a < 0) a += Math.PI * 2;
    const w = hexToHsv(hex);
    onChange(hsvToHex((a / (Math.PI * 2)) * 360, Math.min(1, dist / R), w.v));
  };
  // Re-pointed every render so a callback that was scheduled a frame or two
  // ago (and so closed over an older `hex`) still runs the current logic --
  // only the "preserve brightness while dragging hue/sat" read of `hex`
  // could ever be a frame stale, which isn't perceptible mid-drag.
  const updateFromEventRef = useRef(updateFromEvent);
  updateFromEventRef.current = updateFromEvent;

  const scheduleUpdate = (e) => {
    pendingRef.current = { clientX: e.clientX, clientY: e.clientY };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingRef.current) updateFromEventRef.current(pendingRef.current);
    });
  };
  const flushPending = () => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (pendingRef.current) { updateFromEventRef.current(pendingRef.current); pendingRef.current = null; }
  };

  return (
    <div className="wheel-wrap">
      <canvas ref={canvasRef} id="wheel-canvas" width={180} height={180}
        onPointerDown={(e) => { draggingRef.current = true; e.target.setPointerCapture(e.pointerId); updateFromEvent(e); }}
        onPointerMove={(e) => { if (draggingRef.current) scheduleUpdate(e); }}
        onPointerUp={(e) => { if (!draggingRef.current) return; draggingRef.current = false; try { e.target.releasePointerCapture(e.pointerId); } catch { /* ignore */ } flushPending(); onCommit?.(); }}
        onPointerCancel={() => { draggingRef.current = false; if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } pendingRef.current = null; }}
      />
      <div className="wheel-indicator" style={{ left: `${indicatorLeft}%`, top: `${indicatorTop}%`, background: hex }} />
    </div>
  );
}

export const PRESET_SWATCHES = ['#7e1b1b', '#c2591c', '#c99a2e', '#3c5c29', '#1b4b6b', '#4b2e63', '#3b2a22', '#4a4d52'];

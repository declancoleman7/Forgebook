import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import { PAINT_LIBRARY, paintCategory, paintKey } from '../data/paints.js';
import { colourSimilarity, hexToHsv, hsvToHex } from '../utils/colour.js';
import { relativeTime } from '../utils/format.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useMyPaints, useWantToBuy, useToggleWanted, useSavedPaintKeys, useToggleSavePaint } from '../queries/usePaints.js';
import { useMyRatings, useRatingSummary, useRatePaint } from '../queries/useRatings.js';
import { usePaintNotes, useSubmitNote } from '../queries/useNotes.js';
import { useReportContent } from '../queries/useReports.js';
import { useReport } from '../report/ReportContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

const CATEGORY_GLYPH = {
  wash: '<path d="M12 3C12 3 6 10 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 10 12 3 12 3Z"/>',
  contrast: '<circle cx="12" cy="12" r="9"/>',
  metallic: '<path d="M12 2L14 9L21 9L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9L10 9Z"/>',
  primer: '<circle cx="12" cy="7" r="2.4"/><circle cx="7" cy="16" r="2.4"/><circle cx="17" cy="16" r="2.4"/>',
};
function TypeBadge({ type }) {
  const glyph = CATEGORY_GLYPH[paintCategory(type)];
  return glyph ? <span className="paint-type-badge"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none" dangerouslySetInnerHTML={{ __html: glyph }} /></span> : null;
}

const STAR_PATH = 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2z';
// Emitted 5-down-to-1 -- paired with .star-row's row-reverse, this puts
// stars back in correct 1-5 left-to-right order while letting the CSS
// ":hover ~" hack (which only selects *later* DOM siblings) land on the
// stars to the hovered one's left.
function StarRow({ value, size = 16, interactive, onRate }) {
  return (
    <span className={`star-row ${interactive ? 'star-row--interactive' : ''}`}>
      {[5, 4, 3, 2, 1].map((n) => (
        <span key={n} className={`star-row__star ${value != null && n <= Math.round(value) ? 'is-filled' : ''}`}
          role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
          onClick={interactive ? () => onRate(n) : undefined}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d={STAR_PATH} /></svg>
        </span>
      ))}
    </span>
  );
}

function resolveSourceHex(myPaints, name, brand) {
  const owned = myPaints.find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
  if (owned) return owned.hex;
  const lib = PAINT_LIBRARY.find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
  return lib ? lib.hex : null;
}
function resolveSourceType(myPaints, name, brand) {
  const owned = myPaints.find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
  if (owned) return owned.type;
  const lib = PAINT_LIBRARY.find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
  return lib ? lib.type : null;
}

// Shared by the full render and the live-drag path, so the two can never
// rank results differently -- ported from the old app's computeColourMatches().
function computeColourMatches(hex, excludeKey, resultFilter, sourceBrand, sourceType, myPaints) {
  const sourceCat = sourceType ? paintCategory(sourceType) : null;
  let matches = PAINT_LIBRARY
    .filter((p) => paintKey(p.name, p.brand) !== excludeKey)
    .map((p) => ({ paint: p, score: colourSimilarity(hex, p.hex), sameCategory: !sourceCat || paintCategory(p.type) === sourceCat }));
  if (resultFilter === 'other' && sourceBrand) {
    matches = matches.filter((m) => m.paint.brand !== sourceBrand);
  } else if (resultFilter === 'owned') {
    matches = matches.filter((m) => myPaints.some((p) => paintKey(p.name, p.brand) === paintKey(m.paint.name, m.paint.brand)));
  }
  matches.sort((a, b) => (b.sameCategory - a.sameCategory) || (b.score - a.score));
  return matches.slice(0, 20);
}

function ColourWheel({ hex, onChange, onCommit }) {
  const canvasRef = useRef(null);
  const draggingRef = useRef(false);

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

  return (
    <div className="wheel-wrap">
      <canvas ref={canvasRef} id="wheel-canvas" width={180} height={180}
        onPointerDown={(e) => { draggingRef.current = true; e.target.setPointerCapture(e.pointerId); updateFromEvent(e); }}
        onPointerMove={(e) => { if (draggingRef.current) updateFromEvent(e); }}
        onPointerUp={(e) => { if (!draggingRef.current) return; draggingRef.current = false; try { e.target.releasePointerCapture(e.pointerId); } catch { /* ignore */ } onCommit?.(); }}
        onPointerCancel={() => { draggingRef.current = false; }}
      />
      <div className="wheel-indicator" style={{ left: `${indicatorLeft}%`, top: `${indicatorTop}%`, background: hex }} />
    </div>
  );
}

const PRESET_SWATCHES = ['#7e1b1b', '#c2591c', '#c99a2e', '#3c5c29', '#1b4b6b', '#4b2e63', '#3b2a22', '#4a4d52'];

function NoteRow({ n, myId, onReport }) {
  const isMine = n.userId === myId;
  const pending = n.flagged || n.status === 'hidden';
  return (
    <div className={`comment-row ${pending ? 'is-pending' : ''}`}>
      <div className="comment-row__meta">
        <span className="comment-row__author"><Avatar displayName={n.author.displayName} url={n.author.avatarUrl} size={16} /> {n.author.displayName}{n.author.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</span>
        <span className="comment-row__time">{relativeTime(n.createdAt)}</span>
        {pending && <span className="pill-status">{n.status === 'hidden' ? 'Hidden — reported' : 'Hidden — pending review'}</span>}
      </div>
      <div className="comment-row__body">{n.body}</div>
      {!isMine && <button className="comment-row__report" title="Report" onClick={() => onReport(n.id)}><Icon name="flag" size={13} /></button>}
    </div>
  );
}

// Ported from the old app's viewSimilarColours() -- works two ways: anchored
// to a specific paint (:name/:brand, reached from any swatch app-wide via
// "Find similar" style entry points), or the free-standing colour-picker
// tool (bare /similar, no source paint) with a colour wheel + brightness
// slider + hex input + preset swatches.
export default function SimilarColours() {
  const { name, brand } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, userId } = useAuth();
  const showToast = useToast();
  const report = useReport();
  const reportContent = useReportContent();

  const { data: myPaints = [] } = useMyPaints();
  const { data: wantedKeys = [] } = useWantToBuy();
  const toggleWanted = useToggleWanted();
  const { data: savedPaintKeys = [] } = useSavedPaintKeys();
  const toggleSavePaint = useToggleSavePaint();
  const { data: myRatings = [] } = useMyRatings();
  const { data: ratingSummary = [] } = useRatingSummary();
  const ratePaint = useRatePaint();

  const isColourMode = !name;
  const sourceName = name ? decodeURIComponent(name) : null;
  const sourceBrand = brand ? decodeURIComponent(brand) : null;

  const [pickerHex, setPickerHex] = useState('#b8863f');
  const [resultFilter, setResultFilter] = useState(isColourMode ? 'all' : 'other');
  const [hexInputValue, setHexInputValue] = useState('');

  const activeHex = isColourMode ? pickerHex : (resolveSourceHex(myPaints, sourceName, sourceBrand) || '#b8863f');
  const sourceType = !isColourMode ? resolveSourceType(myPaints, sourceName, sourceBrand) : null;
  const excludeKey = !isColourMode ? paintKey(sourceName, sourceBrand) : '__none__';

  useEffect(() => { setHexInputValue(activeHex.replace('#', '').toUpperCase()); }, [activeHex]);

  const matches = useMemo(
    () => computeColourMatches(activeHex, excludeKey, resultFilter, !isColourMode ? sourceBrand : null, sourceType, myPaints),
    [activeHex, excludeKey, resultFilter, isColourMode, sourceBrand, sourceType, myPaints]
  );

  const paintNotesQuery = usePaintNotes(!isColourMode ? paintKey(sourceName, sourceBrand) : null);
  const submitNote = useSubmitNote(!isColourMode ? paintKey(sourceName, sourceBrand) : null);
  const [noteBody, setNoteBody] = useState('');

  const wheel = hexToHsv(activeHex);
  const brightnessGradient = `linear-gradient(to right, #000, ${hsvToHex(wheel.h, wheel.s, 1)})`;

  const mineRating = myRatings.find((r) => !isColourMode && r.paintKey === paintKey(sourceName, sourceBrand))?.stars ?? null;
  const summary = !isColourMode ? ratingSummary.find((s) => s.paintKey === paintKey(sourceName, sourceBrand)) : null;
  const saved = !isColourMode && savedPaintKeys.includes(paintKey(sourceName, sourceBrand));

  const onHexInput = (v) => {
    const clean = v.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHexInputValue(clean);
    if (clean.length === 6) setPickerHex('#' + clean);
  };

  const rate = (n) => {
    if (!isSignedIn) { showToast('Sign in to rate paints'); return; }
    ratePaint.mutate({ name: sourceName, brand: sourceBrand, stars: n });
  };
  const toggleSave = () => {
    if (!isSignedIn) { showToast('Sign in to save paints'); return; }
    toggleSavePaint.mutate({ key: paintKey(sourceName, sourceBrand), saved });
  };
  const postNote = async () => {
    const body = noteBody.trim();
    if (!body) { showToast('Write a note first'); return; }
    try {
      await submitNote.mutateAsync(body);
      setNoteBody('');
      showToast('Note posted');
    } catch (e) {
      showToast(e.message || "Couldn't post that note — try again.");
    }
  };
  const reportNote = async (id) => {
    if (!isSignedIn) { showToast('Sign in to report content'); return; }
    const reason = await report('note');
    if (reason === null) return;
    try {
      const res = await reportContent.mutateAsync({ contentType: 'paint_note', contentId: id, reason });
      showToast(res.alreadyReported ? "You've already reported this" : 'Reported — thanks for flagging this');
    } catch (e) {
      showToast(e.message || "Couldn't send that report — try again.");
    }
  };

  const findSimilarTo = (p) => navigate(`/similar/${encodeURIComponent(p.name)}/${encodeURIComponent(p.brand)}`);

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/paint-library')}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Similar Colours</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="detail-sub" style={{ margin: '4px 2px' }}>
        {isColourMode
          ? "Not sure what it's called? Set a colour directly and match it against every brand Forgebook knows."
          : 'Tap a swatch below to explore further, or use the filters to narrow these down.'}
      </div>

      {isColourMode && (
        <div className="colour-match-card">
          <ColourWheel hex={pickerHex} onChange={setPickerHex} />
          <div className="brightness-row">
            <span className="brightness-row__label">Bright</span>
            <input type="range" min={0} max={100} value={Math.round(wheel.v * 100)} style={{ background: brightnessGradient }}
              onChange={(e) => setPickerHex(hsvToHex(wheel.h, wheel.s, Number(e.target.value) / 100))} />
          </div>
          <div className="colour-match-card__row">
            <div className="picker-swatch" style={{ background: pickerHex }} />
            <div className="picker-fields">
              <div className="hex-field">
                <span>#</span>
                <input type="text" maxLength={6} value={hexInputValue} onChange={(e) => onHexInput(e.target.value)} />
              </div>
              <div className="swatch-row">
                {PRESET_SWATCHES.map((h) => <button type="button" key={h} style={{ background: h }} onClick={() => setPickerHex(h)} />)}
              </div>
            </div>
          </div>
          <div className="label-hint" style={{ marginTop: 10 }}>Drag the wheel for hue and saturation, or type a hex code.</div>
        </div>
      )}

      <div className="colour-match-source">
        <div className="paint-row__swatch" style={{ background: activeHex }}>{!isColourMode && <TypeBadge type={sourceType} />}</div>
        <div>
          <div className="results-source__name">{isColourMode ? 'Your colour' : sourceName}</div>
          <div className="results-source__meta">{isColourMode ? activeHex.toUpperCase() : sourceBrand}</div>
        </div>
      </div>

      {!isColourMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="rating-widget">
            <StarRow value={mineRating} size={22} interactive onRate={rate} />
            <div className="rating-widget__meta">
              {summary ? <><span className="rating-widget__avg">{Number(summary.avgStars).toFixed(1)}</span><span className="rating-widget__count">({summary.ratingCount})</span></> : <span className="rating-widget__count">No ratings yet</span>}
              {mineRating && <div className="rating-widget__mine">Your rating: {mineRating}★ · tap a star to change</div>}
            </div>
          </div>
          <button className={`icon-btn ${saved ? 'is-active' : ''}`} aria-label={saved ? 'Remove from saved' : 'Save this paint'} title={saved ? 'Saved' : 'Save'} onClick={toggleSave}>
            <Icon name="bookmark" size={18} />
          </button>
        </div>
      )}

      <div className="lib-filter-seg">
        <button className={resultFilter === 'all' ? 'is-active' : ''} onClick={() => setResultFilter('all')}>All brands</button>
        <button className={resultFilter === 'other' ? 'is-active' : ''} disabled={isColourMode} style={isColourMode ? { opacity: 0.4 } : undefined} onClick={() => setResultFilter('other')}>Other brands</button>
        <button className={resultFilter === 'owned' ? 'is-active' : ''} onClick={() => setResultFilter('owned')}>On my rack</button>
      </div>

      {matches.length ? (() => {
        const same = matches.filter((m) => m.sameCategory);
        const other = matches.filter((m) => !m.sameCategory);
        const mixed = same.length && other.length;
        const row = (m) => {
          const owned = myPaints.find((p) => paintKey(p.name, p.brand) === paintKey(m.paint.name, m.paint.brand));
          const wanted = wantedKeys.includes(paintKey(m.paint.name, m.paint.brand));
          return (
            <div key={paintKey(m.paint.name, m.paint.brand)} className="colour-match-row">
              <div className="paint-row__swatch" title="Find similar colours" style={{ background: m.paint.hex, cursor: 'pointer' }} onClick={() => findSimilarTo(m.paint)}><TypeBadge type={m.paint.type} /></div>
              <div className="colour-match-row__info">
                <div className="paint-row__name">{m.paint.name}</div>
                <div className="paint-row__brand">{m.paint.brand} · {m.paint.type}</div>
              </div>
              <div className="colour-match-row__score">
                <span>{m.score}%</span>
                <div className="colour-match-row__bar"><i style={{ width: `${m.score}%` }} /></div>
              </div>
              {owned
                ? <span className="lib-row__ring is-owned" title="On your rack"><Icon name="check" size={13} /></span>
                : <button className={`lib-row__flag is-wanted ${wanted ? 'is-on' : ''}`} title={wanted ? 'On your buy list' : 'Add to buy list'} onClick={() => toggleWanted.mutate({ name: m.paint.name, brand: m.paint.brand, wanted })}><Icon name="cart" size={13} /></button>}
            </div>
          );
        };
        return mixed ? (
          <>
            <div className="section-label">Same kind of paint</div>{same.map(row)}
            <div className="section-label">Other paints</div>{other.map(row)}
          </>
        ) : matches.map(row);
      })() : <div className="empty-state__sub">No matches.</div>}

      {!isColourMode && (
        <>
          <div className="section-label">Community Notes</div>
          <div className="detail-sub" style={{ margin: '2px 2px 12px' }}>
            Freeform tips from other painters on this paint — comparisons to old ranges, texture, anything that doesn't fit the fields above.
          </div>
          {isSignedIn ? (
            <div className="note-composer">
              <textarea maxLength={500} spellCheck placeholder='e.g. "Similar to the old Citadel Goblin Green"' value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
              <div className="note-composer__footer">
                <span className="char-count">{noteBody.length}/500</span>
                <button className="btn btn-primary btn-sm" disabled={submitNote.isPending} onClick={postNote}>Post note</button>
              </div>
            </div>
          ) : <div className="fine-print" style={{ marginBottom: 14 }}>Sign in to leave a note.</div>}
          {paintNotesQuery.isLoading ? (
            <div className="empty-state__sub">Loading notes…</div>
          ) : paintNotesQuery.data?.length ? (
            paintNotesQuery.data.map((n) => <NoteRow key={n.id} n={n} myId={userId} onReport={reportNote} />)
          ) : (
            <div className="empty-state__sub">No notes yet — be the first.</div>
          )}
        </>
      )}
    </div>
  );
}

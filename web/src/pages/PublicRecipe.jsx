import { useParams } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import Avatar from '../components/Avatar.jsx';
import CommentThread from '../components/CommentThread.jsx';
import { faction } from '../data/factions.js';
import { paintCategory } from '../data/paints.js';
import { usePublicRecipe } from '../queries/usePublic.js';

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

function estimatedMinutes(r) {
  const steps = (r.steps || []).length;
  if (!steps) return 0;
  return Math.max(5, Math.round((steps * 12) / 5) * 5);
}
function formatDuration(mins) {
  if (!mins) return '—';
  if (mins < 60) return `~${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}
function groupStepsByArea(steps) {
  const groups = [];
  (steps || []).forEach((s, i) => {
    const area = (s.area || '').trim();
    const last = groups[groups.length - 1];
    if (last && last.area === area) last.items.push({ step: s, num: i + 1 });
    else groups.push({ area, items: [{ step: s, num: i + 1 }] });
  });
  return groups;
}
function resolvePublicStepPaint(paints, step, field) {
  const id = step[field];
  if (id) return paints.find((p) => p.id === id) || null;
  const want = step[field === 'paintId' ? 'wantPaint' : 'mixWantPaint'];
  return want ? { ...want, isWant: true } : null;
}

// The #/r/:authorId/:id share-link route -- entirely separate from the
// signed-in app: no shell, no bottom nav, works for a visitor with no
// Forgebook account and no session at all (see App.jsx, which routes this
// outside the auth gate). CommentThread itself already degrades to "Sign
// in to comment" when signed out, so it's reused as-is rather than a
// separate read-only rendering here.
export default function PublicRecipe() {
  const { authorId, id } = useParams();
  const { data: result, isLoading } = usePublicRecipe(authorId, id);

  if (isLoading) {
    return (
      <div className="gate public-recipe">
        <div className="gate__card public-recipe__card">
          <div className="gate__brand"><Icon name="book" size={26} /> Forgebook</div>
          <div className="detail-sub" style={{ marginTop: 14 }}>Loading recipe…</div>
        </div>
      </div>
    );
  }

  if (!result || !result.recipe.published || result.recipe.deleted) {
    return (
      <div className="gate public-recipe">
        <div className="gate__card public-recipe__card">
          <div className="gate__brand"><Icon name="book" size={26} /> Forgebook</div>
          <div className="gate__tagline">This recipe isn't available — it may have been unpublished or removed.</div>
          <a className="btn btn-primary btn-block" style={{ marginTop: 20 }} href="./">Open Forgebook</a>
        </div>
      </div>
    );
  }

  const { recipe: r, paints, authorName, authorAvatarUrl } = result;
  const f = faction(r.faction);
  const steps = r.steps || [];

  const usedPaints = [];
  const seenKeys = new Set();
  steps.forEach((s) => {
    [['paintId', 'wantPaint'], ['mixPaintId', 'mixWantPaint']].forEach(([idField]) => {
      const p = resolvePublicStepPaint(paints, s, idField);
      if (!p) return;
      const key = p.id || `want:${p.name || ''}|${p.brand || ''}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      usedPaints.push(p);
    });
  });

  return (
    <div className="gate public-recipe">
      <div className="gate__card public-recipe__card">
        <div className="public-recipe__banner">
          <span><Icon name="book" size={15} /> Made with Forgebook</span>
          <a href="./">Get the app</a>
        </div>

        <div className={`detail-hero ${r.photo ? 'has-photo' : ''}`} style={{ '--faction-color': f.color, ...(r.photo ? { backgroundImage: `url('${r.photo}')`, backgroundPosition: `${(r.photoFocalX ?? 0.5) * 100}% ${(r.photoFocalY ?? 0.5) * 100}%` } : {}) }}>
          {!r.photo && <span className="emblem-badge emblem-badge--xl"><EmblemSvg emblemKey={f.emblem} size={40} /></span>}
        </div>

        <div className="detail-crumbs">
          <span style={{ color: f.color }}>{f.label}</span>
          <span className="sep">/</span>
          <span>{r.unit || 'General'}</span>
        </div>
        <div className="detail-title">{r.name}</div>
        <div className="shared-badge">
          <Avatar displayName={authorName} url={authorAvatarUrl} size={16} /> Shared by{' '}
          <a href={`#/u/${encodeURIComponent(authorId)}`} style={{ color: 'inherit' }}>{authorName}</a>
        </div>

        <div className="metastrip">
          <div className="metastrip__cell"><div className="metastrip__n">{'●'.repeat(r.difficulty || 1)}{'○'.repeat(5 - (r.difficulty || 1))}</div><div className="metastrip__l">Difficulty</div></div>
          <div className="metastrip__cell"><div className="metastrip__n">{steps.length}</div><div className="metastrip__l">Steps</div></div>
          <div className="metastrip__cell"><div className="metastrip__n">{formatDuration(estimatedMinutes(r))}</div><div className="metastrip__l">Est. time</div></div>
        </div>

        <div className="section-label">Paints Used</div>
        <div className="paint-list">
          {usedPaints.length ? usedPaints.map((p, i) => (
            <div key={i} className="paint-row">
              <div className="paint-row__swatch" style={{ background: p.hex }}><TypeBadge type={p.type} /></div>
              <div>
                <div className="paint-row__name">{p.name}</div>
                <div className="paint-row__brand">{p.brand || ''}{p.type ? ` · ${p.type}` : ''}</div>
              </div>
              <div className="paint-row__hex">{p.hex}</div>
            </div>
          )) : <div className="empty-state__sub">No paints listed.</div>}
        </div>

        <div className="section-label">Method</div>
        {steps.length ? groupStepsByArea(steps).map((g, gi) => (
          <div key={gi}>
            {g.area && <div className="grouphead">{g.area}</div>}
            <div className="layer-stack">
              {g.items.map(({ step: s, num }) => {
                const p = resolvePublicStepPaint(paints, s, 'paintId');
                const mixP = (s.mixPaintId || s.mixWantPaint) ? resolvePublicStepPaint(paints, s, 'mixPaintId') : null;
                const swatchBg = mixP ? `linear-gradient(to bottom, ${p ? p.hex : f.color} 50%, ${mixP.hex} 50%)` : (p ? p.hex : f.color);
                return (
                  <div key={s.id || num} className="layer-stack__row">
                    <div className="layer-stack__num">{num}</div>
                    <div className="layer-stack__swatch" style={{ background: swatchBg }} />
                    <div className="layer-stack__content">
                      <div className="layer-stack__top">
                        <span className="layer-stack__technique">{s.technique}</span>
                        <span className="layer-stack__paint">
                          {p ? p.name : '(paint deleted)'}
                          {mixP && <> + {mixP.name}{s.mixRatio ? ` (${s.mixRatio})` : ''}</>}
                        </span>
                      </div>
                      {s.notes && <div className="layer-stack__notes">{s.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )) : <div className="empty-state__sub">No steps recorded.</div>}

        {r.notes && <><div className="section-label">Notes</div><div className="notes-block">{r.notes}</div></>}

        <CommentThread ownerId={authorId} recipeId={id} />

        <a className="btn btn-primary btn-block" style={{ marginTop: 24 }} href="./">
          <Icon name="book" size={16} /> Track your own recipes with Forgebook
        </a>
      </div>
    </div>
  );
}

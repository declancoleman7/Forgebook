import { useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import { faction } from '../data/factions.js';
import { useActiveHobby } from '../hooks/useActiveHobby.js';
import { useFactionArt } from '../hooks/useFactionArt.js';
import { useVisibleRecipes } from '../queries/useRecipes.js';
import { downscaleImage } from '../utils/image.js';
import { useToast } from '../toast/ToastContext.jsx';

// The admin-only global (Supabase-shared) emblem override is deferred;
// this ports the personal (this-device) override only.
export default function FactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const h = useActiveHobby();
  const f = faction(id);
  const [art, setArt, clearArt] = useFactionArt(f.id);
  const fileRef = useRef(null);
  const { data: visibleRecipes = [] } = useVisibleRecipes();

  const onArtChosen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await downscaleImage(file, 480);
    if (!url) return showToast('That image could not be read');
    if (!setArt(url)) return showToast('Storage is full');
    showToast('Emblem updated');
  };

  const { units, general } = useMemo(() => {
    const map = new Map();
    let gen = 0;
    visibleRecipes.filter((r) => r.faction === f.id).forEach((r) => {
      if (!r.unit) { gen++; return; }
      map.set(r.unit, (map.get(r.unit) || 0) + 1);
    });
    return { units: [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)), general: gen };
  }, [visibleRecipes, f.id]);
  const total = general + units.reduce((a, u) => a + u.count, 0);

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/factions')}><Icon name="back" size={18} /></button>
        <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
          <Icon name="image" size={14} /> {art ? 'Change emblem' : 'Add emblem'}
        </button>
      </div>

      <div className={`faction-banner ${art ? 'has-art' : ''}`} style={{ '--faction-color': f.color, ...(art ? { backgroundImage: `url('${art}')` } : {}) }}>
        {!art && <span className="faction-banner__emblem emblem-badge emblem-badge--xl"><EmblemSvg emblemKey={f.emblem} size={40} /></span>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onArtChosen} />

      <div className="detail-title">{f.label}</div>
      <div className="detail-sub">{f.alliance !== 'All' ? `${f.alliance} · ` : ''}{total} recipe{total === 1 ? '' : 's'}</div>

      <div className="section-label">Units</div>
      <div className="unit-list">
        <div className="unit-row is-general" onClick={() => navigate(`/faction/${f.id}/unit/_general`)}>
          <div className="unit-row__bar" style={{ background: f.color }} />
          <div className="unit-row__name">General — {h.wholeGroupLabel}</div>
          <div className="unit-row__count">{general}</div>
          <div className="unit-row__chevron"><Icon name="chevron" size={16} /></div>
        </div>
        {units.map((u) => (
          <div key={u.name} className="unit-row" onClick={() => navigate(`/faction/${f.id}/unit/${encodeURIComponent(u.name)}`)}>
            <div className="unit-row__bar" style={{ background: f.color }} />
            <div className="unit-row__name">{u.name}</div>
            <div className="unit-row__count">{u.count}</div>
            <div className="unit-row__chevron"><Icon name="chevron" size={16} /></div>
          </div>
        ))}
      </div>
      {!units.length && (
        <div className="empty-state__sub" style={{ padding: '10px 2px' }}>
          No units yet for this {h.groupLabel.toLowerCase()}. Units appear here as soon as you save a recipe against one —
          or use General for recipes that apply to the {h.wholeGroupLabel}.
        </div>
      )}

      <div className="detail-actions">
        <button className="btn btn-primary btn-block" onClick={() => navigate('/recipe-new')}>
          + New recipe for {f.label}
        </button>
      </div>
      {art && <button className="btn btn-ghost btn-block" onClick={clearArt}>Remove custom emblem</button>}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { emblemPaths } from '../data/factions.js';
import { useActiveHobby } from '../hooks/useActiveHobby.js';

function slug(s) {
  return encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));
}

// Recipe counts per faction are deferred until the recipes data layer
// exists (Stage 3 batch 4) -- every tile shows no count for now, same as
// "Used In" elsewhere; nothing else about the tile depends on it.
function FactionTile({ f, count }) {
  const navigate = useNavigate();
  const gradId = `mg-${f.id}`;
  return (
    <div className={`faction-tile faction-tile--${slug(f.alliance)}`} style={{ '--faction-color': f.color }} title={f.label} onClick={() => navigate(`/faction/${f.id}`)}>
      <div className="faction-tile__rivet tl" /><div className="faction-tile__rivet tr" /><div className="faction-tile__rivet bl" /><div className="faction-tile__rivet br" />
      {count > 0 && <div className="faction-tile__count">{count}</div>}
      <div className="faction-tile__art">
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="22">
              <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${f.color} 45%, var(--parchment))` }} />
              <stop offset="0.55" style={{ stopColor: f.color }} />
              <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${f.color} 60%, black)` }} />
            </linearGradient>
          </defs>
        </svg>
        <span className="faction-tile__watermark">
          <svg width={66} height={66} viewBox="0 0 24 24" fill={`url(#${gradId})`} stroke="none" style={{ color: f.color }} dangerouslySetInnerHTML={{ __html: emblemPaths(f.emblem) }} />
        </span>
        <svg width={48} height={48} viewBox="0 0 24 24" fill={`url(#${gradId})`} stroke="none" style={{ color: f.color }} dangerouslySetInnerHTML={{ __html: emblemPaths(f.emblem) }} />
      </div>
    </div>
  );
}

export default function Collection() {
  const h = useActiveHobby();

  return (
    <div className="page-enter">
      <div className="page-title">{h.browseTitle}</div>
      {h.systems.map((sys) => {
        const groups = sys.alliances.map((alliance) => {
          const facs = h.factions.filter((f) => f.system === sys.id && f.alliance === alliance);
          if (!facs.length) return null;
          return (
            <div key={alliance}>
              {!h.flatBrowse && <div className="alliance-label">{alliance}</div>}
              <div className="faction-tiles">{facs.map((f) => <FactionTile key={f.id} f={f} count={0} />)}</div>
            </div>
          );
        }).filter(Boolean);
        if (!groups.length) return null;
        return (
          <div key={sys.id}>
            {!h.flatBrowse && <div className="section-label">{sys.label}</div>}
            {groups}
          </div>
        );
      })}
      {h.id === 'warhammer' && (
        <div className="fine-print">
          Emblems are original artwork drawn for Forgebook, not Games Workshop's own icons.
          Open any army to swap in your own image.
        </div>
      )}
    </div>
  );
}

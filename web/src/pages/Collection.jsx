import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { emblemPaths } from '../data/factions.js';
import { useActiveHobby } from '../hooks/useActiveHobby.js';
import { useAllFactionArt } from '../hooks/useFactionArt.js';
import { useGlobalFactionArt } from '../queries/useFactionEmblems.js';
import { useVisibleRecipes } from '../queries/useRecipes.js';
import { useMyHobbyLog } from '../queries/useHobbyLog.js';
import HobbyLogDashboard from '../components/HobbyLogDashboard.jsx';

function slug(s) {
  return encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));
}

// count is recipes, unitCount is Pile of Potential units logged against
// this faction -- shown together ("6 · 12") so the fact that units are
// logged is visible from the grid itself, not only after finding the
// Pile of Potential's own (now-removed) separate faction picker. See the
// Collections/Pile of Potential merge.
function FactionTile({ f, count, unitCount, art }) {
  const navigate = useNavigate();
  const gradId = `mg-${f.id}`;
  return (
    <div className={`faction-tile faction-tile--${slug(f.alliance)}`} style={{ '--faction-color': f.color }} title={f.label} onClick={() => navigate(`/faction/${f.id}`)}>
      <div className="faction-tile__rivet tl" /><div className="faction-tile__rivet tr" /><div className="faction-tile__rivet bl" /><div className="faction-tile__rivet br" />
      {(count > 0 || unitCount > 0) && <div className="faction-tile__count">{count}{unitCount > 0 ? ` · ${unitCount}` : ''}</div>}
      <div className={`faction-tile__art ${art ? 'has-art' : ''}`} style={art ? { backgroundImage: `url('${art}')` } : undefined}>
        {!art && (
          <>
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${f.color} 45%, var(--parchment))` }} />
                  <stop offset="0.55" style={{ stopColor: f.color }} />
                  <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${f.color} 60%, black)` }} />
                </linearGradient>
              </defs>
            </svg>
            {/* This used to also render a second, larger copy of the same
                path as a rotated, low-opacity "watermark" echo behind this
                one. Measured as roughly a third of Collection's mobile
                scroll cost (each inline dangerouslySetInnerHTML SVG is real
                rendering work, and this doubled it per tile for a subtle
                background detail) -- dropped for a real, measured
                mobile-scroll win. */}
            <span className="faction-tile__icon-badge">
              <svg width={38} height={38} viewBox="0 0 24 24" fill={`url(#${gradId})`} stroke="none" style={{ color: f.color }} dangerouslySetInnerHTML={{ __html: emblemPaths(f.emblem) }} />
            </span>
          </>
        )}
      </div>
      <div className="faction-tile__label">{f.label}</div>
    </div>
  );
}

export default function Collection() {
  const h = useActiveHobby();
  const { data: recipes = [] } = useVisibleRecipes();
  const { data: hobbyLog = [] } = useMyHobbyLog();
  const personalArt = useAllFactionArt();
  const { data: globalArt = {} } = useGlobalFactionArt();
  // Personal (this-device) override always wins over the admin's shared
  // one -- same merge order as the old app's viewFactions().
  const art = { ...globalArt, ...personalArt };
  // Which top-level pane is showing -- "armies" is the faction grid this
  // page has always been; "dashboard" is the cross-army Pile of Potential
  // rollup, moved here (out from under Profile) since browsing one army's
  // recipes+units and viewing the rollup across all of them are the two
  // halves of the same "browse your collection" job. See the Collections/
  // Pile of Potential merge.
  //
  // Lives in the URL, not useState -- this page remounts fresh every time
  // browser/back-button history returns to it (e.g. from a faction's own
  // back button), and useState would silently reset to "armies" on every
  // one of those remounts, discarding which tab you'd actually been on.
  // replace:true because switching tabs is an adjustment to the view
  // you're already on, not a new place to go back through -- same
  // convention as HobbyLog.jsx's replaceParams for its own filter tabs.
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'dashboard' ? 'dashboard' : 'armies';
  const setTab = (next) => setSearchParams({ tab: next }, { replace: true });
  const countByFaction = useMemo(() => {
    const map = new Map();
    recipes.forEach((r) => map.set(r.faction, (map.get(r.faction) || 0) + 1));
    return map;
  }, [recipes]);
  const unitCountByFaction = useMemo(() => {
    const map = new Map();
    hobbyLog.forEach((e) => { if (e.factionId) map.set(e.factionId, (map.get(e.factionId) || 0) + 1); });
    return map;
  }, [hobbyLog]);

  return (
    <div className="page-enter">
      <div className="page-title">{h.browseTitle}</div>
      <div className="lib-filter-seg" style={{ marginBottom: 14 }}>
        <button className={tab === 'armies' ? 'is-active' : ''} onClick={() => setTab('armies')}>Armies</button>
        <button className={tab === 'dashboard' ? 'is-active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button>
      </div>

      {tab === 'dashboard' ? (
        <HobbyLogDashboard />
      ) : (
        <>
          {h.systems.map((sys) => {
            const groups = sys.alliances.map((alliance) => {
              const facs = h.factions.filter((f) => f.system === sys.id && f.alliance === alliance);
              if (!facs.length) return null;
              return (
                <div key={alliance}>
                  {!h.flatBrowse && <div className="alliance-label">{alliance}</div>}
                  <div className="faction-tiles">{facs.map((f) => <FactionTile key={f.id} f={f} count={countByFaction.get(f.id) || 0} unitCount={unitCountByFaction.get(f.id) || 0} art={art[f.id]} />)}</div>
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
        </>
      )}
    </div>
  );
}

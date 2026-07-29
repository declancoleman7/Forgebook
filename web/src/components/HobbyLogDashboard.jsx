import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import ProjectCard from './HobbyProjectCard.jsx';
import { faction as findFaction } from '../data/factions.js';
import { HOBBY_STAGES } from '../data/hobbyStages.js';
import { MODEL_CATEGORIES, DEFAULT_MODEL_CATEGORY, categoryWeight } from '../data/modelCategories.js';
import { useMyHobbyLog, useHobbyLogStageEvents } from '../queries/useHobbyLog.js';
import { useMyHobbyProjects } from '../queries/useHobbyProjects.js';

function StagePipelineChart({ entries, onStageClick }) {
  const totalMinis = entries.reduce((sum, e) => sum + (e.quantity || 0), 0);
  if (!totalMinis) return null;
  const weightedTotal = Math.round(entries.reduce((sum, e) => sum + (e.quantity || 0) * categoryWeight(e.category), 0));
  const rows = HOBBY_STAGES
    .map((s) => ({ ...s, n: entries.reduce((sum, e) => sum + (e.stageCounts?.[s.id] || 0), 0) }))
    .filter((s) => s.n > 0);

  return (
    <div className="hoblog-pipeline">
      {weightedTotal !== totalMinis && (
        <div className="label-hint" style={{ marginBottom: 10 }}>{totalMinis} miniatures · ~{weightedTotal} weighted by category</div>
      )}
      {rows.map((s) => {
        const pct = Math.round((s.n / totalMinis) * 100);
        return (
          <div key={s.id} className={`hoblog-pipeline__row ${onStageClick ? 'is-clickable' : ''}`} onClick={onStageClick ? () => onStageClick(s.id) : undefined}>
            <span className="hoblog-pipeline__label">{s.label}</span>
            <div className="hoblog-pipeline__track"><div className="hoblog-pipeline__fill" style={{ width: `${pct}%`, background: s.color }} /></div>
            <span className="hoblog-pipeline__pct">{pct}%</span>
          </div>
        );
      })}
      <div className="hoblog-timeline__legend" style={{ marginTop: 12 }}>
        {rows.map((s) => <span key={s.id} className="hoblog-timeline__legend-item"><i style={{ background: s.color }} />{s.label}</span>)}
      </div>
    </div>
  );
}

// "This month you painted 20" / "built 40" -- net progress THIS calendar
// month, per stage, straight from the real transition log.
function ThisMonthStats({ stageEvents, onStageClick }) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const totals = {};
  stageEvents.forEach((ev) => {
    if (!ev.occurredAt) return;
    const d = new Date(ev.occurredAt);
    if (`${d.getFullYear()}-${d.getMonth()}` !== monthKey) return;
    totals[ev.stageId] = (totals[ev.stageId] || 0) + ev.delta;
  });
  const rows = HOBBY_STAGES.filter((s) => totals[s.id]);
  if (!rows.length) return null;

  return (
    <div className="hoblog-month-tiles">
      {rows.map((s) => (
        <div key={s.id} className={`hoblog-month-tile ${onStageClick ? 'is-clickable' : ''}`} style={{ '--tile-color': s.color }} onClick={onStageClick ? () => onStageClick(s.id) : undefined}>
          <div className="hoblog-month-tile__label">{s.label}</div>
          <div className="hoblog-month-tile__value">{totals[s.id] > 0 ? '+' : ''}{totals[s.id]}</div>
        </div>
      ))}
    </div>
  );
}

// A simple horizontal bar list, shared shape for "models by army" and
// "models by category" -- onRowClick is optional and per-row, since a row
// can opt out (clickable: false) when there's nowhere sensible to send it.
function BarBreakdown({ rows, onRowClick }) {
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="hoblog-bars">
      {rows.map((r) => {
        const clickable = !!onRowClick && r.clickable !== false;
        return (
          <div key={r.key} className={`hoblog-bars__row ${clickable ? 'is-clickable' : ''}`} onClick={clickable ? () => onRowClick(r) : undefined}>
            <div className="hoblog-bars__top">
              <span className="hoblog-bars__label"><i style={{ background: r.color }} />{r.label}</span>
              <span className="hoblog-bars__n">{r.n}</span>
            </div>
            <div className="hoblog-bars__track"><div className="hoblog-bars__fill" style={{ width: `${(r.n / max) * 100}%`, background: r.color }} /></div>
          </div>
        );
      })}
    </div>
  );
}

// Rows here click straight through to that army's own page (/faction/:id) --
// the merged Collections+Pile of Potential page, same destination a
// Collection grid tile already leads to. "No army set" opts out (no faction
// to land on).
function ModelsByArmyChart({ entries, onArmyClick }) {
  const totals = new Map();
  entries.forEach((e) => {
    const key = e.factionId || '__none__';
    if (!totals.has(key)) totals.set(key, { n: 0 });
    totals.get(key).n += (e.quantity || 0);
  });
  const rows = [...totals.entries()]
    .map(([key, v]) => {
      const f = key !== '__none__' ? findFaction(key) : null;
      return { key, n: v.n, label: f ? f.label : 'No army set', color: f?.color || 'var(--ink-dim)', clickable: !!f, faction: key };
    })
    .sort((a, b) => b.n - a.n);
  return <BarBreakdown rows={rows} onRowClick={onArmyClick ? (r) => onArmyClick(r.faction) : undefined} />;
}

function ModelsByCategoryChart({ entries, onCategoryClick }) {
  const totals = new Map();
  entries.forEach((e) => {
    const key = e.category || DEFAULT_MODEL_CATEGORY;
    totals.set(key, (totals.get(key) || 0) + (e.quantity || 0));
  });
  const rows = MODEL_CATEGORIES
    .filter((c) => totals.get(c.id))
    .map((c) => ({ key: c.id, n: totals.get(c.id), label: c.label, color: c.color }))
    .sort((a, b) => b.n - a.n);
  return <BarBreakdown rows={rows} onRowClick={onCategoryClick ? (r) => onCategoryClick(r.key) : undefined} />;
}

// A stacked column per month -- each segment is one stage's net "reached
// this stage or beyond" delta that month.
function PipelineTimelineChart({ stageEvents, onStageClick }) {
  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
  }
  const perMonth = months.map(({ key }) => {
    const totals = {};
    stageEvents.forEach((ev) => {
      if (!ev.occurredAt) return;
      const d = new Date(ev.occurredAt);
      if (`${d.getFullYear()}-${d.getMonth()}` !== key) return;
      totals[ev.stageId] = (totals[ev.stageId] || 0) + ev.delta;
    });
    return totals;
  });
  const monthTotals = perMonth.map((t) => HOBBY_STAGES.reduce((sum, s) => sum + Math.max(0, t[s.id] || 0), 0));
  const max = Math.max(1, ...monthTotals);
  if (!monthTotals.some((n) => n > 0)) return null;

  return (
    <div className="hoblog-trend">
      <div className="hoblog-trend__bars">
        <div className="hoblog-trend__grid"><i /><i /><i /><i /></div>
        {months.map((m, i) => {
          const totals = perMonth[i];
          const segments = HOBBY_STAGES.filter((s) => (totals[s.id] || 0) > 0);
          return (
            <div key={m.key} className="hoblog-trend__col">
              <span className="hoblog-trend__count">{monthTotals[i] || ''}</span>
              <div className="hoblog-trend__track">
                <div className="hoblog-timeline__stack" style={{ height: `${Math.max(4, (monthTotals[i] / max) * 100)}%` }}>
                  {segments.map((s) => (
                    <div key={s.id} className={onStageClick ? 'is-clickable' : ''} title={`${s.label}: ${totals[s.id]}`}
                      style={{ flex: totals[s.id], background: s.color }}
                      onClick={onStageClick ? (e) => { e.stopPropagation(); onStageClick(s.id); } : undefined} />
                  ))}
                </div>
              </div>
              <span className="hoblog-trend__label">{m.label}</span>
            </div>
          );
        })}
      </div>
      <div className="hoblog-timeline__legend">
        {HOBBY_STAGES.map((s) => (
          <span key={s.id} className="hoblog-timeline__legend-item"><i style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
    </div>
  );
}

const DASH_VIEWS = ['overview', 'army', 'category', 'timeline'];

// The cross-army Pile of Potential rollup (pipeline %, breakdowns, projects)
// -- lives under Collection's own "Dashboard" tab (see the Collections +
// Pile of Potential merge) rather than nested under Profile, since it's the
// natural second half of "browse your armies": one tab per army's own
// recipes+units, one tab for the view across all of them at once. Fully
// self-contained (fetches its own data) so it can be dropped into any page.
export default function HobbyLogDashboard() {
  const navigate = useNavigate();
  const { data: entries = [] } = useMyHobbyLog();
  const { data: projects = [] } = useMyHobbyProjects();
  const { data: stageEvents = [] } = useHobbyLogStageEvents();
  const [dashView, setDashView] = useState('overview');
  const touchStartRef = useRef(null);
  const onTouchStart = (e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const idx = DASH_VIEWS.indexOf(dashView);
    const nextIdx = dx < 0 ? Math.min(idx + 1, DASH_VIEWS.length - 1) : Math.max(idx - 1, 0);
    setDashView(DASH_VIEWS[nextIdx]);
  };

  if (!entries.length) {
    return <EmptyDashboard onNewUnit={() => navigate('/hobby-log?entry=new')} />;
  }

  return (
    <div>
      <div className="lib-filter-seg" style={{ marginBottom: 10 }}>
        <button className={dashView === 'overview' ? 'is-active' : ''} onClick={() => setDashView('overview')}>Overview</button>
        <button className={dashView === 'army' ? 'is-active' : ''} onClick={() => setDashView('army')}>By Army</button>
        <button className={dashView === 'category' ? 'is-active' : ''} onClick={() => setDashView('category')}>By Category</button>
        <button className={dashView === 'timeline' ? 'is-active' : ''} onClick={() => setDashView('timeline')}>Timeline</button>
      </div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {dashView === 'overview' && (
          <>
            <div className="section-label" style={{ marginTop: 0 }}>Your pipeline</div>
            <StagePipelineChart entries={entries} onStageClick={(id) => navigate(`/hobby-log?hobby=all&stage=${id}`)} />
            <ThisMonthStats stageEvents={stageEvents} onStageClick={(id) => navigate(`/hobby-log?hobby=all&stage=${id}`)} />
          </>
        )}
        {dashView === 'army' && (
          <>
            <div className="section-label" style={{ marginTop: 0 }}>Models by army</div>
            <ModelsByArmyChart entries={entries} onArmyClick={(factionId) => navigate(`/faction/${factionId}`)} />
          </>
        )}
        {dashView === 'category' && (
          <>
            <div className="section-label" style={{ marginTop: 0 }}>Models by category</div>
            <ModelsByCategoryChart entries={entries} onCategoryClick={(id) => navigate(`/hobby-log?hobby=all&cat=${id}`)} />
          </>
        )}
        {dashView === 'timeline' && (
          <>
            <div className="section-label" style={{ marginTop: 0 }}>Pipeline over time</div>
            <div className="detail-sub" style={{ margin: '2px 2px 12px' }}>How many models reached each stage, month by month.</div>
            <PipelineTimelineChart stageEvents={stageEvents} onStageClick={(id) => navigate(`/hobby-log?hobby=all&stage=${id}`)} />
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="section-label" style={{ flex: 1 }}>Projects</div>
        {projects.length > 4 && (
          <button type="button" className="section-see-all" onClick={() => navigate('/hobby-log?projects=all')}>See all ({projects.length})</button>
        )}
      </div>
      {projects.length > 0 && (
        <div className="hobbylog-list" style={{ marginBottom: 10 }}>
          {projects.slice(0, 4).map((project) => <ProjectCard key={project.id} project={project} entries={entries} onEdit={(id) => navigate(`/hobby-log?project=${id}`)} />)}
        </div>
      )}
      <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('/hobby-log?project=new')}>
        <Icon name="plus" size={14} /> New project
      </button>
    </div>
  );
}

function EmptyDashboard({ onNewUnit }) {
  return (
    <div className="empty-state">
      <div className="empty-state__title">Nothing logged yet</div>
      <div className="empty-state__sub">Track units you're building and painting here, separate from the recipes themselves.</div>
      <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={onNewUnit}>+ New unit</button>
    </div>
  );
}

import Icon from '../icons.jsx';
import HobbyStageStack from './HobbyStageStack.jsx';
import { HOBBY_STAGES, stageProgressPercent } from '../data/hobbyStages.js';

// A Project's own progress is always derived by summing whichever units are
// linked to it -- weighted by miniature count, not a per-unit average, so a
// 40-model unit moves the needle far more than a 1-model one, matching how
// quantity is the unit of measure everywhere else in the Pile of Potential.
export function sumStageCounts(entries, entryIds) {
  const linked = entries.filter((e) => entryIds.includes(e.id));
  const quantity = linked.reduce((sum, e) => sum + (e.quantity || 0), 0);
  const stageCounts = {};
  linked.forEach((e) => {
    HOBBY_STAGES.forEach((s) => { stageCounts[s.id] = (stageCounts[s.id] || 0) + (e.stageCounts?.[s.id] || 0); });
  });
  return { quantity, stageCounts };
}

export default function ProjectCard({ project, entries, onEdit }) {
  const { quantity, stageCounts } = sumStageCounts(entries, project.entryIds);
  const pct = stageProgressPercent(stageCounts, quantity);
  return (
    <div className="hobbylog-card" onClick={() => onEdit(project.id)}>
      <div className="hobbylog-card__photo"><Icon name="clipboard-check" size={22} /></div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{project.title} <span className="hobbylog-card__pct">{pct}%</span></div>
        <HobbyStageStack stageCounts={stageCounts} quantity={quantity} />
        <div className="hobbylog-card__meta">
          <span>{project.entryIds.length} unit{project.entryIds.length === 1 ? '' : 's'}</span>
          {project.isPublic && <span className="hobbylog-card__public" title="Visible on your public profile"><Icon name="user" size={11} /> Public</span>}
        </div>
      </div>
    </div>
  );
}

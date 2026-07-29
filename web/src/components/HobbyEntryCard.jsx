import { useState } from 'react';
import Icon from '../icons.jsx';
import Lightbox from './Lightbox.jsx';
import HobbyStageStack from './HobbyStageStack.jsx';
import { faction as findFaction } from '../data/factions.js';
import { DEFAULT_MODEL_CATEGORY, categoryLabel } from '../data/modelCategories.js';
import { relativeTime } from '../utils/format.js';

// A single Pile of Potential unit row -- extracted out of HobbyLog.jsx so
// FactionDetail.jsx can show a faction's logged units inline (see the
// Collections/Pile of Potential merge) without either page importing the
// other.
export default function HobbyEntryCard({ entry, onEdit }) {
  const f = entry.factionId ? findFaction(entry.factionId) : null;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const openLightbox = (e) => { e.stopPropagation(); setLightboxOpen(true); };
  return (
    <div className="hobbylog-card" onClick={() => onEdit(entry.id)}>
      <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')`, cursor: 'pointer' } : undefined}
        onClick={entry.photo ? openLightbox : undefined}>
        {!entry.photo && <Icon name="paintdrop" size={22} />}
      </div>
      {lightboxOpen && entry.photo && (
        <div onClick={(e) => e.stopPropagation()}>
          <Lightbox url={entry.photo} onClose={() => setLightboxOpen(false)} />
        </div>
      )}
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{entry.title} <span className="hobbylog-card__qty">×{entry.quantity}</span></div>
        <HobbyStageStack stageCounts={entry.stageCounts} quantity={entry.quantity} />
        <div className="hobbylog-card__meta">
          {f && <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>}
          {entry.category && entry.category !== DEFAULT_MODEL_CATEGORY && <span className="hobbylog-card__tag">{categoryLabel(entry.category)}</span>}
          {entry.completedAt && <span className="hobbylog-card__public">Finished {relativeTime(entry.completedAt)}</span>}
          {entry.isPublic && <span className="hobbylog-card__public" title="Visible on your public profile"><Icon name="user" size={11} /> Public</span>}
          {entry.recipeLinks.length > 0 && <span className="hobbylog-card__recipes">{entry.recipeLinks.length} recipe{entry.recipeLinks.length === 1 ? '' : 's'}</span>}
        </div>
      </div>
    </div>
  );
}

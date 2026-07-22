import { HOBBY_STAGES } from '../data/hobbyStages.js';

// A stacked, colour-coded bar showing a unit's whole miniature count split
// across whichever build/paint stages it actually has models in right now.
// Shared by the Pile of Potential's own list (HobbyLog.jsx) and the public
// profile views (Profile.jsx/ProfileSection.jsx), which render the same
// entries read-only.
export default function HobbyStageStack({ stageCounts, quantity }) {
  if (!quantity) return null;
  return (
    <div className="hobbylog-stack" title={HOBBY_STAGES.map((s) => `${s.label}: ${stageCounts?.[s.id] || 0}`).join(' · ')}>
      {HOBBY_STAGES.filter((s) => (stageCounts?.[s.id] || 0) > 0).map((s) => (
        <span key={s.id} style={{ width: `${((stageCounts[s.id] || 0) / quantity) * 100}%`, background: s.color }} />
      ))}
    </div>
  );
}

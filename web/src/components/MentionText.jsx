import { useNavigate } from 'react-router-dom';
import { splitMentions } from '../utils/mentions.js';
import { useAllProfileNames } from '../queries/useSocial.js';

// Ported from the old app's highlightMentions() -- renders a posted
// comment/note body with any @mention styled and linked to that profile.
export default function MentionText({ text }) {
  const navigate = useNavigate();
  const { data: profiles = [] } = useAllProfileNames();
  const segments = splitMentions(text, profiles);

  return (
    <>
      {segments.map((seg, i) => seg.profile ? (
        <span key={i} className="mention" style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${seg.profile.userId}`)}>{seg.text}</span>
      ) : (
        <span key={i}>{seg.text}</span>
      ))}
    </>
  );
}

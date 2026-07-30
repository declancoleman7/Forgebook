import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';

// Shared wrapper for About/Terms/Privacy -- same shell-less .gate/.gate__card
// treatment PublicRecipe.jsx already uses for a page that has to work for a
// visitor with no account and no session (someone deciding whether to sign
// up should be able to read the Terms/Privacy first), widened the same way
// via a modifier class rather than the narrow auth-card width.
export default function LegalPageShell({ title, children }) {
  const navigate = useNavigate();
  return (
    <div className="gate legal-page">
      <div className="gate__card legal-page__card">
        <div className="legal-page__header">
          <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}><Icon name="back" size={18} /></button>
          <div className="gate__brand" style={{ marginBottom: 0 }}><Icon name="book" size={22} /> Forgebook</div>
          <div style={{ width: 36 }} />
        </div>
        <h1 className="legal-page__title">{title}</h1>
        <div className="legal-page__body">{children}</div>
      </div>
    </div>
  );
}

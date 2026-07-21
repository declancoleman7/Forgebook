import Icon from '../icons.jsx';

export default function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-state__glyph"><Icon name={icon} size={30} /></div>
      <div className="empty-state__title">{title}</div>
      <div className="empty-state__sub">{sub}</div>
    </div>
  );
}

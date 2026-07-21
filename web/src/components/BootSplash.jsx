import Icon from '../icons.jsx';

export default function BootSplash() {
  return (
    <div className="boot-splash">
      <span className="boot-splash__mark"><Icon name="book" size={30} /></span>
      <span className="boot-splash__word">Forgebook</span>
    </div>
  );
}

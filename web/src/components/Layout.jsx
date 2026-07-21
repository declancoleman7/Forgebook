import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../icons.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const NAV_ITEMS = [
  { route: 'home', label: 'Home', icon: 'home', path: '/home' },
  { route: 'factions', label: 'Collection', icon: 'shield', path: '/factions' },
  { route: 'recipes', label: 'Search', icon: 'search', path: '/recipes' },
  { route: 'paints', label: 'Paints', icon: 'paintdrop', path: '/paints' },
  { route: 'profile', label: 'Profile', icon: 'user', path: '/u' },
];

// Same "is this tab the active one" grouping as the old render()'s tail --
// a few routes count as belonging to a nav tab that isn't their own exact
// path (e.g. viewing one recipe still highlights the Search tab).
function isActiveNavRoute(navRoute, pathname) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (navRoute === 'home') return seg === 'home' || seg === '';
  if (navRoute === 'factions') return seg === 'factions' || seg === 'faction' || seg === 'unit';
  if (navRoute === 'recipes') return seg === 'recipes' || seg === 'recipe' || seg === 'recipe-new';
  if (navRoute === 'paints') return seg === 'paints' || seg === 'paint' || seg === 'paint-new' || seg === 'paint-library';
  if (navRoute === 'profile') return seg === 'u' || seg === 'settings' || seg === 'notifications' || seg === 'change-password';
  return false;
}

// The profile tab's icon slot becomes the signed-in user's own avatar --
// Stage 2 wires in the real profile-picture lookup; a plain fallback
// letter avatar for now.
function ProfileGlyph({ size }) {
  const { email } = useAuth();
  const letter = (email || '?').trim()[0]?.toUpperCase() || '?';
  return <span className="avatar avatar--fallback" style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}>{letter}</span>;
}

function NavGlyph({ item, size }) {
  return item.route === 'profile' ? <ProfileGlyph size={size} /> : <Icon name={item.icon} size={size} />;
}

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div id="app">
      <nav className="side-nav">
        <div className="side-nav__brand"><Icon name="book" size={20} /> Forgebook</div>
        {NAV_ITEMS.map((n) => (
          <NavLink key={n.route} to={n.path} className={`side-nav__item ${isActiveNavRoute(n.route, pathname) ? 'is-active' : ''}`}>
            <NavGlyph item={n} size={18} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <header className="topbar">
        <div className="topbar__brand"><span className="glyph"><Icon name="book" size={16} /></span> Forgebook</div>
        <div className="topbar__spacer" />
        {/* Hobby switcher dropdown + notification bell + sync pill are wired
            up once their data hooks exist (Stage 2/3) -- static chrome
            only for now. */}
        <button className="topbar__bell" aria-label="Notifications">
          <Icon name="bell" size={18} />
        </button>
      </header>
      <main id="view-root">
        <Outlet />
      </main>
      <NavLink className="fab" to="/recipe-new" aria-label="Add recipe">
        <Icon name="plus" size={24} />
      </NavLink>
      <nav className="bottom-nav">
        {NAV_ITEMS.map((n) => (
          <NavLink key={n.route} to={n.path} className={`bottom-nav__item ${isActiveNavRoute(n.route, pathname) ? 'is-active' : ''}`} aria-label={n.label}>
            <NavGlyph item={n} size={24} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

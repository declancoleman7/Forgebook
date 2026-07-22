import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from './Avatar.jsx';
import HobbySwitcher from './HobbySwitcher.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useActiveHobbyId } from '../hooks/useActiveHobby.js';
import { useMyProfile } from '../queries/useProfile.js';
import { useNotifications } from '../queries/useNotifications.js';
import { registerServiceWorker } from '../serviceWorker.js';

const STATIC_NAV_ITEMS = [
  { route: 'home', label: 'Home', icon: 'home', path: '/home' },
  { route: 'factions', label: 'Collection', icon: 'shield', path: '/factions' },
  { route: 'recipes', label: 'Search', icon: 'search', path: '/recipes' },
  { route: 'paints', label: 'Paints', icon: 'paintdrop', path: '/paints' },
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

// The profile tab's icon slot becomes the signed-in user's own avatar,
// kept fresh as it changes (Settings) since this is part of the persistent
// shell, not the routed page.
function ProfileGlyph({ size }) {
  const { email } = useAuth();
  const { data: profile } = useMyProfile();
  return <Avatar displayName={profile?.displayName || email} url={profile?.avatarUrl} size={size} />;
}

function NavGlyph({ item, size }) {
  return item.route === 'profile' ? <ProfileGlyph size={size} /> : <Icon name={item.icon} size={size} />;
}

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;
  // The Profile tab always points at your OWN profile -- baked in here the
  // same way the old app's buildShell() baked currentUserId() into its
  // static nav markup once at boot, not the bare "Find a Painter" search
  // screen (/u with no id), which the old app's own nav never links to
  // either (see ProfileSearch.jsx).
  const NAV_ITEMS = [...STATIC_NAV_ITEMS, { route: 'profile', label: 'Profile', icon: 'user', path: `/u/${userId}` }];

  useEffect(() => { registerServiceWorker(); }, []);

  // Per-hobby background art/colour theming -- ported from the old app's
  // setActiveHobbyId(), which sets this same attribute on <html>. CSS
  // (forgebook.css) already has the html[data-hobby="dnd"] rules; this was
  // the missing piece that actually applies the attribute.
  const activeHobbyId = useActiveHobbyId();
  useEffect(() => {
    if (activeHobbyId === 'warhammer') document.documentElement.removeAttribute('data-hobby');
    else document.documentElement.setAttribute('data-hobby', activeHobbyId);
    return () => document.documentElement.removeAttribute('data-hobby');
  }, [activeHobbyId]);

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
        <HobbySwitcher />
        <button className="topbar__bell" aria-label="Notifications" onClick={() => navigate('/notifications')}>
          <Icon name="bell" size={18} />
          {unreadCount > 0 && <span className="topbar__bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
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

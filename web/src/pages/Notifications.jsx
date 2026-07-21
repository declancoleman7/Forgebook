import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { relativeTime } from '../utils/format.js';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../queries/useNotifications.js';

// Recipe/paint NAME resolution in the notification text (e.g. `commented on
// your recipe "Bloodletter Red"`) is deferred until the recipes/paints data
// layer exists (Stage 3) -- these read generically for now.
function notificationText(n) {
  if (n.type === 'comment') return 'commented on your recipe';
  if (n.type === 'rating') return 'rated a paint you feature in a recipe';
  if (n.type === 'like') return 'liked your recipe';
  if (n.type === 'reply') return 'replied to your comment';
  if (n.recipeId) return 'mentioned you in a comment';
  return 'mentioned you in a note';
}

function NotificationRow({ n, onOpen }) {
  return (
    <div className={`comment-row ${n.read ? '' : 'is-unread'}`} style={{ cursor: 'pointer' }} onClick={() => onOpen(n)}>
      <div className="comment-row__meta">
        <Avatar displayName={n.actor.displayName} url={n.actor.avatarUrl} size={18} />
        <span className="comment-row__author">{n.actor.displayName}{n.actor.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</span>
        <span className="comment-row__time">{relativeTime(n.createdAt)}</span>
        {!n.read && <span className="notif-dot" aria-hidden="true" />}
      </div>
      <div className="comment-row__body">{notificationText(n)}</div>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotification = (n) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.recipeId) navigate(`/recipe/${n.recipeId}/by/${n.recipeOwnerId}`);
    // Paint-note deep links land once Similar Colours' real page exists (Stage 3).
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/home')}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Notifications</div>
        <div style={{ width: 36 }} />
      </div>
      {unreadCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <button className="btn btn-ghost btn-sm" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>Mark all as read</button>
        </div>
      )}
      {isLoading ? (
        <div className="empty-state__sub">Loading…</div>
      ) : notifications.length ? (
        notifications.map((n) => <NotificationRow key={n.id} n={n} onOpen={openNotification} />)
      ) : (
        <EmptyState icon="bell" title="No notifications yet" sub="You'll hear about comments, ratings, and mentions here." />
      )}
    </div>
  );
}

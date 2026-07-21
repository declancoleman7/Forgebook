import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useSearchProfiles } from '../queries/useSocial.js';

// Ported from the old app's viewProfile({}) (no id) branch -- "Find a
// Painter." Reachable at the bare /u route; the bottom-nav Profile tab
// itself always links straight to your own profile (see Layout.jsx),
// same as the old app's shell baking currentUserId() into that nav item.
export default function ProfileSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: results = [] } = useSearchProfiles(query);

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/settings')}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Find a Painter</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <input type="text" placeholder="Search by display name" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      </div>
      {results.length ? (
        results.map((p) => (
          <div key={p.userId} className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${p.userId}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar displayName={p.displayName} url={p.avatarUrl} size={28} />
              <div className="settings-row__label">{p.displayName}{p.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</div>
            </div>
          </div>
        ))
      ) : query.trim() ? (
        <EmptyState icon="search" title="No painters found" sub="Try a different name." />
      ) : (
        <div className="empty-state__sub">Type a name to search.</div>
      )}
    </div>
  );
}

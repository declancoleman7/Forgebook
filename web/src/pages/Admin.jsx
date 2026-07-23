import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useOpenReports, useHideContent, useDismissReports, useSetUserBanned } from '../queries/useAdmin.js';
import { useSearchProfiles } from '../queries/useSocial.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

function ReportRow({ report }) {
  const showToast = useToast();
  const confirm = useConfirm();
  const hide = useHideContent();
  const dismiss = useDismissReports();

  const kindLabel = report.contentType === 'recipe_comment' ? 'Comment' : 'Paint note';

  const doHide = async () => {
    if (!(await confirm(`Hide this ${kindLabel.toLowerCase()}? Only its author and admins will still be able to see it.`, { okLabel: 'Hide' }))) return;
    try {
      await hide.mutateAsync({ contentType: report.contentType, contentId: report.contentId, reportIds: report.reportIds });
      showToast('Hidden');
    } catch (err) {
      showToast(err.message || "Couldn't hide that — try again");
    }
  };

  const doDismiss = async () => {
    try {
      await dismiss.mutateAsync({ contentType: report.contentType, contentId: report.contentId, reportIds: report.reportIds });
      showToast('Dismissed');
    } catch (err) {
      showToast(err.message || "Couldn't dismiss that — try again");
    }
  };

  return (
    <div className="settings-row" style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span className="pill-status pill-status--draft">{kindLabel}</span>
        <span className="settings-row__desc" style={{ margin: 0 }}>
          {report.reportCount} report{report.reportCount === 1 ? '' : 's'} · by {report.author.displayName}
        </span>
      </div>
      <div className="settings-row__label" style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{report.body}</div>
      {report.reasons.length > 0 && (
        <div className="fine-print" style={{ marginBottom: 8 }}>Reasons given: {report.reasons.join(' · ')}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={doHide}>Hide</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={doDismiss}>Dismiss</button>
      </div>
    </div>
  );
}

function ReportsTab() {
  const { data: reports = [], isLoading } = useOpenReports();
  if (isLoading) return <div className="empty-state__sub">Loading…</div>;
  if (!reports.length) return <EmptyState icon="flag" title="No open reports" sub="Anything reported by users will show up here." />;
  return (
    <div className="settings-group">
      {reports.map((r) => <ReportRow key={`${r.contentType}:${r.contentId}`} report={r} />)}
    </div>
  );
}

function UserRow({ profile }) {
  const { userId: myUserId } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();
  const setBanned = useSetUserBanned();
  const isSelf = profile.userId === myUserId;

  const toggleBan = async () => {
    const next = !profile.isBanned;
    if (next && !(await confirm(`Ban ${profile.displayName}? They won't be able to sign in again until unbanned.`, { okLabel: 'Ban' }))) return;
    try {
      await setBanned.mutateAsync({ targetUserId: profile.userId, banned: next });
      showToast(next ? 'Banned' : 'Unbanned');
    } catch (err) {
      showToast(err.message || "Couldn't update that account — try again");
    }
  };

  return (
    <div className="settings-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar displayName={profile.displayName} url={profile.avatarUrl} size={28} />
        <div>
          <div className="settings-row__label">
            {profile.displayName}{profile.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}
          </div>
          <div className="settings-row__desc">{profile.isBanned ? 'Banned' : 'Active'}</div>
        </div>
      </div>
      {!isSelf && (
        <button type="button" className={`btn btn-sm ${profile.isBanned ? 'btn-ghost' : 'btn-danger'}`} onClick={toggleBan}>
          {profile.isBanned ? 'Unban' : 'Ban'}
        </button>
      )}
    </div>
  );
}

function UsersTab() {
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = useSearchProfiles(query);
  return (
    <div>
      <div className="mini-search" style={{ marginBottom: 12 }}>
        <Icon name="search" size={14} />
        <input type="text" placeholder="Search painters by name" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {!query.trim() ? (
        <div className="empty-state__sub">Search for an account to ban or unban.</div>
      ) : isLoading ? (
        <div className="empty-state__sub">Searching…</div>
      ) : results.length ? (
        <div className="settings-group">
          {results.map((p) => <UserRow key={p.userId} profile={p} />)}
        </div>
      ) : (
        <div className="empty-state__sub">No painters match.</div>
      )}
    </div>
  );
}

// Only ever linked to from Settings' own isAdmin-gated row -- RLS is the
// real gate on the data (a non-admin's report/ban mutations are refused
// server-side regardless), this is just so a stray direct visit to the URL
// doesn't render a confusing half-working page for anyone else.
export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('reports'); // reports | users

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/settings')}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Admin</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="lib-filter-seg" style={{ marginBottom: 16 }}>
        <button className={tab === 'reports' ? 'is-active' : ''} onClick={() => setTab('reports')}>Reports</button>
        <button className={tab === 'users' ? 'is-active' : ''} onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'reports' ? <ReportsTab /> : <UsersTab />}
    </div>
  );
}

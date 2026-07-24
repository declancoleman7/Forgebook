import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useOpenReports, useTopOffenders, useHideContent, useDismissReports, useSetUserBanned } from '../queries/useAdmin.js';
import { useOpenPaintSuggestions, useReviewPaintSuggestion } from '../queries/usePaintSuggestions.js';
import { useSearchProfiles } from '../queries/useSocial.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

const KIND_LABELS = {
  recipe_comment: 'Comment',
  paint_note: 'Paint note',
  recipe_photo: 'Recipe photo',
  avatar_photo: 'Profile photo',
};

// Shared by the reports queue and an offender's own drill-down (see
// OffenderItemRow below) -- both show either an image or a text body for
// whatever got flagged, just with different actions available underneath.
function ReportedContentPreview({ report }) {
  return report.kind === 'image' ? (
    <div style={{ marginBottom: 6 }}>
      {report.imageUrl ? (
        <img src={report.imageUrl} alt={report.caption} style={{ maxWidth: 160, maxHeight: 160, borderRadius: 'var(--radius-md)', display: 'block' }} />
      ) : (
        <div className="empty-state__sub" style={{ padding: 0 }}>Photo already removed</div>
      )}
    </div>
  ) : (
    <div className="settings-row__label" style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{report.body}</div>
  );
}

function ReportRow({ report }) {
  const showToast = useToast();
  const confirm = useConfirm();
  const hide = useHideContent();
  const dismiss = useDismissReports();

  const kindLabel = KIND_LABELS[report.contentType] || 'Content';
  // A photo's "hide" clears the photo reference entirely (see
  // useHideContent) rather than flipping a status flag like comments/notes
  // -- there's no "only its author and admins can still see it" middle
  // ground for an image, so the confirm copy is worded differently.
  const hideMessage = report.kind === 'image'
    ? `Remove this ${kindLabel.toLowerCase()}? This can't be undone from here.`
    : `Hide this ${kindLabel.toLowerCase()}? Only its author and admins will still be able to see it.`;

  const doHide = async () => {
    if (!(await confirm(hideMessage, { okLabel: report.kind === 'image' ? 'Remove' : 'Hide' }))) return;
    try {
      await hide.mutateAsync({ contentType: report.contentType, contentId: report.contentId, reportIds: report.reportIds });
      showToast(report.kind === 'image' ? 'Removed' : 'Hidden');
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
          {report.reportCount} report{report.reportCount === 1 ? '' : 's'} · Posted by {report.author.displayName}
        </span>
      </div>
      <ReportedContentPreview report={report} />
      {report.reasons.length > 0 && (
        <div className="fine-print" style={{ marginBottom: 8 }}>Reasons given: {report.reasons.join(' · ')}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={doHide}>{report.kind === 'image' ? 'Remove' : 'Hide'}</button>
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

// A user-submitted "please add this paint (or range)" request -- approving
// or rejecting just marks it reviewed and drops it from the queue.
// PAINT_LIBRARY is a static bundled file, not a live table, so "approved"
// doesn't add anything itself; it's a note to actually add this in a future
// library update, kept separate from "rejected" so good ideas don't get
// lost in the same pile as ones that were already covered or not a fit.
function SuggestionRow({ suggestion }) {
  const showToast = useToast();
  const review = useReviewPaintSuggestion();

  const act = async (status) => {
    try {
      await review.mutateAsync({ id: suggestion.id, status });
      showToast(status === 'approved' ? 'Marked for a future update' : 'Rejected');
    } catch (err) {
      showToast(err.message || "Couldn't update that — try again");
    }
  };

  return (
    <div className="settings-row" style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {suggestion.hex && <span style={{ width: 16, height: 16, borderRadius: 4, background: suggestion.hex, flexShrink: 0 }} />}
        <span className="settings-row__label" style={{ margin: 0 }}>{suggestion.name}</span>
      </div>
      <div className="settings-row__desc" style={{ marginBottom: 6 }}>
        {[suggestion.brand, suggestion.type].filter(Boolean).join(' · ') || 'No brand/type given'}
      </div>
      {suggestion.notes && <div className="fine-print" style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>{suggestion.notes}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => act('approved')}>Approve</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => act('rejected')}>Reject</button>
      </div>
    </div>
  );
}

function SuggestionsTab() {
  const { data: suggestions = [], isLoading } = useOpenPaintSuggestions();
  if (isLoading) return <div className="empty-state__sub">Loading…</div>;
  if (!suggestions.length) return <EmptyState icon="flag" title="No pending suggestions" sub="Paint or range suggestions from users will show up here." />;
  return (
    <div className="settings-group">
      {suggestions.map((s) => <SuggestionRow key={s.id} suggestion={s} />)}
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

// Read-only -- an offender's own flagged history includes already-resolved
// items (see useTopOffenders), so Hide/Dismiss (which only make sense for
// something still open) don't belong here; Ban, on the offender as a
// whole, is the one action this view offers (see OffenderDetail).
function OffenderItemRow({ item }) {
  const kindLabel = KIND_LABELS[item.contentType] || 'Content';
  return (
    <div className="settings-row" style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span className="pill-status pill-status--draft">{kindLabel}</span>
        <span className="settings-row__desc" style={{ margin: 0 }}>{item.reportCount} report{item.reportCount === 1 ? '' : 's'}</span>
      </div>
      <ReportedContentPreview report={item} />
      {item.reasons.length > 0 && <div className="fine-print">Reasons given: {item.reasons.join(' · ')}</div>}
    </div>
  );
}

function OffenderRow({ offender, onSelect }) {
  return (
    <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => onSelect(offender.ownerId)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar displayName={offender.displayName} url={offender.avatarUrl} size={28} />
        <div>
          <div className="settings-row__label">
            {offender.displayName}{offender.isBanned && <span className="pill-status pill-status--draft" style={{ marginLeft: 6 }}>Banned</span>}
          </div>
          <div className="settings-row__desc">{offender.totalReports} report{offender.totalReports === 1 ? '' : 's'} across {offender.items.length} item{offender.items.length === 1 ? '' : 's'}</div>
        </div>
      </div>
      <Icon name="chevron" size={18} />
    </div>
  );
}

function OffenderDetail({ offender, onBack }) {
  const showToast = useToast();
  const confirm = useConfirm();
  const setBanned = useSetUserBanned();

  const toggleBan = async () => {
    const next = !offender.isBanned;
    if (next && !(await confirm(`Ban ${offender.displayName}? They won't be able to sign in again until unbanned.`, { okLabel: 'Ban' }))) return;
    try {
      await setBanned.mutateAsync({ targetUserId: offender.ownerId, banned: next });
      showToast(next ? 'Banned' : 'Unbanned');
    } catch (err) {
      showToast(err.message || "Couldn't update that account — try again");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button type="button" className="icon-btn" onClick={onBack}><Icon name="back" size={16} /></button>
        <Avatar displayName={offender.displayName} url={offender.avatarUrl} size={28} />
        <div style={{ flex: 1 }}>
          <div className="settings-row__label" style={{ margin: 0 }}>{offender.displayName}</div>
          <div className="settings-row__desc">{offender.totalReports} report{offender.totalReports === 1 ? '' : 's'} total</div>
        </div>
        <button type="button" className={`btn btn-sm ${offender.isBanned ? 'btn-ghost' : 'btn-danger'}`} onClick={toggleBan}>
          {offender.isBanned ? 'Unban' : 'Ban'}
        </button>
      </div>
      <div className="settings-group">
        {offender.items.map((item) => <OffenderItemRow key={`${item.contentType}:${item.contentId}`} item={item} />)}
      </div>
    </div>
  );
}

function UsersTab() {
  const [query, setQuery] = useState('');
  const [selectedOffenderId, setSelectedOffenderId] = useState(null);
  const { data: results = [], isLoading } = useSearchProfiles(query);
  const { data: offenders = [], isLoading: offendersLoading } = useTopOffenders();

  const selectedOffender = offenders.find((o) => o.ownerId === selectedOffenderId);
  if (selectedOffender) {
    return <OffenderDetail offender={selectedOffender} onBack={() => setSelectedOffenderId(null)} />;
  }

  return (
    <div>
      <div className="mini-search" style={{ marginBottom: 12 }}>
        <Icon name="search" size={14} />
        <input type="text" placeholder="Search painters by name" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {query.trim() ? (
        isLoading ? (
          <div className="empty-state__sub">Searching…</div>
        ) : results.length ? (
          <div className="settings-group">
            {results.map((p) => <UserRow key={p.userId} profile={p} />)}
          </div>
        ) : (
          <div className="empty-state__sub">No painters match.</div>
        )
      ) : (
        <>
          <div className="section-label">Top offenders</div>
          {offendersLoading ? (
            <div className="empty-state__sub">Loading…</div>
          ) : offenders.length ? (
            <div className="settings-group">
              {offenders.map((o) => <OffenderRow key={o.ownerId} offender={o} onSelect={setSelectedOffenderId} />)}
            </div>
          ) : (
            <div className="empty-state__sub">No repeat reports yet. Search above to look up a specific account.</div>
          )}
        </>
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
  const [tab, setTab] = useState('reports'); // reports | suggestions | users

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/settings')}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Admin</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="lib-filter-seg" style={{ marginBottom: 16 }}>
        <button className={tab === 'reports' ? 'is-active' : ''} onClick={() => setTab('reports')}>Reports</button>
        <button className={tab === 'suggestions' ? 'is-active' : ''} onClick={() => setTab('suggestions')}>Suggestions</button>
        <button className={tab === 'users' ? 'is-active' : ''} onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'reports' ? <ReportsTab /> : tab === 'suggestions' ? <SuggestionsTab /> : <UsersTab />}
    </div>
  );
}

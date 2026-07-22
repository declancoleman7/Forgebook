import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipePicker from '../components/RecipePicker.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import { HOBBIES, faction as findFaction } from '../data/factions.js';
import { downscaleImage } from '../utils/image.js';
import { useMyHobbyLog, useCreateHobbyLogEntry, useUpdateHobbyLogEntry, useDeleteHobbyLogEntry, useUploadHobbyLogPhoto } from '../queries/useHobbyLog.js';
import { useMyRecipes } from '../queries/useRecipes.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

// A physical-assembly pipeline, not a generic progress label -- bought it,
// built it, primed it, painting it, done.
const STATUSES = [
  { id: 'owned', label: 'Owned' },
  { id: 'built', label: 'Built' },
  { id: 'primed', label: 'Primed' },
  { id: 'wip', label: 'Work in Progress' },
  { id: 'completed', label: 'Complete' },
];

function StatusBadge({ status }) {
  const s = STATUSES.find((x) => x.id === status) || STATUSES[0];
  return <span className={`hobbylog-status hobbylog-status--${status}`}>{s.label}</span>;
}

function EntryCard({ entry, onEdit }) {
  const f = entry.factionId ? findFaction(entry.factionId) : null;
  return (
    <div className="hobbylog-card" onClick={() => onEdit(entry.id)}>
      <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')` } : undefined}>
        {!entry.photo && <Icon name="paintdrop" size={22} />}
      </div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{entry.title}</div>
        <div className="hobbylog-card__meta">
          <StatusBadge status={entry.status} />
          {f && <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>}
          {entry.isPublic && <span className="hobbylog-card__public" title="Visible on your public profile"><Icon name="user" size={11} /> Public</span>}
          {entry.recipeLinks.length > 0 && <span className="hobbylog-card__recipes">{entry.recipeLinks.length} recipe{entry.recipeLinks.length === 1 ? '' : 's'}</span>}
        </div>
      </div>
    </div>
  );
}

function EntryForm({ existing, myRecipes, prefill, onClose }) {
  const { userId } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();
  const create = useCreateHobbyLogEntry();
  const update = useUpdateHobbyLogEntry();
  const del = useDeleteHobbyLogEntry();
  const uploadPhoto = useUploadHobbyLogPhoto();
  const photoInputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [entry, setEntry] = useState(() => existing
    ? { ...existing, originalPhoto: existing.photo || null }
    : { id: null, title: '', notes: '', status: 'owned', hobbyId: prefill?.hobbyId || '', factionId: prefill?.factionId || '', photo: null, photoPath: null, originalPhoto: null, isPublic: false, recipeLinks: [] });

  const patch = (fields) => setEntry((e) => ({ ...e, ...fields }));
  const hobby = HOBBIES.find((h) => h.id === entry.hobbyId);
  const factionsForHobby = hobby ? (hobby.flatBrowse ? hobby.factions : hobby.factions) : [];
  const eligibleRecipes = entry.hobbyId ? myRecipes.filter((r) => (r.hobbyId || 'warhammer') === entry.hobbyId) : myRecipes;
  const linkedRecipes = entry.recipeLinks.map((l) => myRecipes.find((r) => r.id === l.recipeId)).filter(Boolean);

  const toggleRecipe = (r) => {
    const key = { recipeOwnerId: userId, recipeId: r.id };
    const has = entry.recipeLinks.some((l) => l.recipeId === r.id);
    patch({ recipeLinks: has ? entry.recipeLinks.filter((l) => l.recipeId !== r.id) : [...entry.recipeLinks, key] });
  };

  const onPhotoChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await downscaleImage(file, 900);
    patch({ photo: url });
  };

  const save = async () => {
    if (!entry.title.trim()) { showToast('Give the project a title first'); return; }
    let photoPath = entry.photo !== (entry.originalPhoto || null) ? null : (entry.photoPath || null);
    if (entry.photo && String(entry.photo).startsWith('data:')) {
      showToast('Uploading photo…');
      try {
        photoPath = await uploadPhoto.mutateAsync({ dataUrl: entry.photo });
      } catch {
        showToast("Couldn't upload that photo — try again");
        return;
      }
    }
    const payload = {
      id: entry.id, title: entry.title.trim(), notes: entry.notes, status: entry.status,
      hobbyId: entry.hobbyId || null, factionId: entry.factionId || null,
      photoPath, isPublic: entry.isPublic, recipeLinks: entry.recipeLinks,
    };
    try {
      if (entry.id) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      showToast('Saved');
      onClose();
    } catch (err) {
      showToast(err.message || "Couldn't save that — try again");
    }
  };

  const doDelete = async () => {
    if (!(await confirm(`Delete "${entry.title}" from your hobby log?`))) return;
    await del.mutateAsync(entry.id);
    showToast('Deleted');
    onClose();
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={onClose}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{entry.id ? 'Edit Entry' : 'New Entry'}</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="field">
        <label>Project title</label>
        <input type="text" value={entry.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Iron Hands Combat Patrol" />
      </div>

      <div className="field">
        <label>Status</label>
        <div className="status-picker">
          {STATUSES.map((s) => (
            <button type="button" key={s.id} className={entry.status === s.id ? 'is-selected' : ''} onClick={() => patch({ status: s.id })}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Hobby <span className="label-hint">optional</span></label>
        <select value={entry.hobbyId} onChange={(e) => patch({ hobbyId: e.target.value, factionId: '' })}>
          <option value="">Not linked to a hobby</option>
          {HOBBIES.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
        </select>
      </div>

      {hobby && (
        <div className="field">
          <label>{hobby.groupLabel} <span className="label-hint">optional</span></label>
          <select value={entry.factionId} onChange={(e) => patch({ factionId: e.target.value })}>
            <option value="">None</option>
            {factionsForHobby.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
      )}

      <div className="field">
        <label>Notes</label>
        <textarea rows={4} value={entry.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="What's the plan, what's left to do..." />
      </div>

      <div className="field">
        <label>Photo</label>
        <div className="photo-field">
          {entry.photo ? (
            <>
              <div className="photo-field__preview" style={{ backgroundImage: `url('${entry.photo}')` }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => photoInputRef.current?.click()}>Replace</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => patch({ photo: null, photoPath: null })}>Remove</button>
            </>
          ) : (
            <button type="button" className="repeater-add" style={{ margin: 0 }} onClick={() => photoInputRef.current?.click()}>+ Add photo</button>
          )}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChosen} />
      </div>

      {myRecipes.length > 0 && (
        <div className="field">
          <label>Recipes used <span className="label-hint">optional — link how you actually painted this</span></label>
          {linkedRecipes.length > 0 && (
            <div className="faction-row" style={{ marginBottom: 8 }}>
              {linkedRecipes.map((r) => (
                <div key={r.id} className="faction-chip is-active" style={{ '--chip-color': findFaction(r.faction).color }}>
                  {r.name}
                  <button type="button" aria-label={`Remove ${r.name}`} onClick={() => toggleRecipe(r)} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 4, display: 'inline-flex' }}>
                    <Icon name="x" size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="repeater-add" style={{ margin: 0 }} onClick={() => setPickerOpen(true)}>
            <Icon name="search" size={14} /> {linkedRecipes.length ? 'Add another recipe' : 'Choose recipes'}
          </button>
        </div>
      )}

      {pickerOpen && (
        <RecipePicker
          recipes={eligibleRecipes}
          selectedIds={new Set(entry.recipeLinks.map((l) => l.recipeId))}
          onToggle={toggleRecipe}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Public entry</div>
            <div className="settings-row__desc">Shows on your profile for other people to read. Off by default.</div>
          </div>
          <button type="button" className={`toggle ${entry.isPublic ? 'is-on' : ''}`} onClick={() => patch({ isPublic: !entry.isPublic })}><i /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Save</button>
        {entry.id && <button className="btn btn-danger" onClick={doDelete}>Delete</button>}
      </div>
    </div>
  );
}

function FactionDashTile({ f, count, label, icon, onClick }) {
  return (
    <div className="faction-tile" style={{ '--faction-color': f.color }} title={label} onClick={onClick}>
      <div className="faction-tile__rivet tl" /><div className="faction-tile__rivet tr" /><div className="faction-tile__rivet bl" /><div className="faction-tile__rivet br" />
      <div className="faction-tile__count">{count}</div>
      <div className="faction-tile__art">
        <span className="emblem-badge emblem-badge--lg">{icon || <EmblemSvg emblemKey={f.emblem} size={30} />}</span>
      </div>
      <div className="faction-tile__label">{label}</div>
    </div>
  );
}

export default function HobbyLog() {
  const navigate = useNavigate();
  const { data: entries = [], isLoading } = useMyHobbyLog();
  const { data: myRecipes = [] } = useMyRecipes();
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null); // null | 'new' | entry id
  // null = hobby-picker dashboard; 'all' = flat list of everything (the
  // escape hatch, same view this page used to open straight to);
  // otherwise a hobby id, drilling into that hobby's factions below.
  const [browseHobbyId, setBrowseHobbyId] = useState(null);
  // null = faction grid; '__general__' = this hobby's entries with no
  // faction set; otherwise a faction id, scoping the list to just that one.
  const [browseFactionId, setBrowseFactionId] = useState(null);

  if (editingId) {
    const existing = editingId === 'new' ? null : entries.find((e) => e.id === editingId);
    const prefill = editingId === 'new' && browseHobbyId && browseHobbyId !== 'all'
      ? { hobbyId: browseHobbyId, factionId: browseFactionId && browseFactionId !== '__general__' ? browseFactionId : '' }
      : null;
    return <EntryForm key={editingId} existing={existing} myRecipes={myRecipes} prefill={prefill} onClose={() => setEditingId(null)} />;
  }

  if (isLoading) return <div className="empty-state__sub">Loading…</div>;

  // --- Level 0: pick a hobby -------------------------------------------
  if (!browseHobbyId) {
    const hobbyCounts = new Map();
    let unsorted = 0;
    entries.forEach((e) => { if (e.hobbyId) hobbyCounts.set(e.hobbyId, (hobbyCounts.get(e.hobbyId) || 0) + 1); else unsorted++; });

    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="icon-btn" onClick={() => navigate(-1)}><Icon name="back" size={18} /></button>
          <div className="page-title" style={{ margin: 0 }}>Hobby Log</div>
          <button className="icon-btn" onClick={() => setEditingId('new')}><Icon name="plus" size={18} /></button>
        </div>
        <div className="detail-sub" style={{ marginBottom: 14 }}>
          Track what you're painting project by project. Pick a hobby to see the armies or categories you've logged something for.
        </div>
        <div className="settings-group">
          {HOBBIES.map((h) => {
            const n = hobbyCounts.get(h.id) || 0;
            return (
              <div key={h.id} className="settings-row" style={{ cursor: 'pointer' }} onClick={() => setBrowseHobbyId(h.id)}>
                <div>
                  <div className="settings-row__label">{h.label}</div>
                  <div className="settings-row__desc">{n} project{n === 1 ? '' : 's'} logged</div>
                </div>
                <Icon name="chevron" size={18} />
              </div>
            );
          })}
          {unsorted > 0 && (
            <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => { setBrowseHobbyId('all'); setBrowseFactionId(null); }}>
              <div>
                <div className="settings-row__label">Not linked to a hobby</div>
                <div className="settings-row__desc">{unsorted} project{unsorted === 1 ? '' : 's'}</div>
              </div>
              <Icon name="chevron" size={18} />
            </div>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={() => setBrowseHobbyId('all')}>
          Browse everything at once
        </button>
      </div>
    );
  }

  const isFlatAll = browseHobbyId === 'all';

  // --- Level 1: pick a faction/category within the chosen hobby ---------
  if (!isFlatAll && !browseFactionId) {
    const hobby = HOBBIES.find((h) => h.id === browseHobbyId);
    const hobbyEntries = entries.filter((e) => e.hobbyId === browseHobbyId);
    const factionCounts = new Map();
    let generalCount = 0;
    hobbyEntries.forEach((e) => { if (e.factionId) factionCounts.set(e.factionId, (factionCounts.get(e.factionId) || 0) + 1); else generalCount++; });
    const ownedFactions = [...factionCounts.keys()].map((id) => findFaction(id)).filter(Boolean);

    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="icon-btn" onClick={() => setBrowseHobbyId(null)}><Icon name="back" size={18} /></button>
          <div className="page-title" style={{ margin: 0 }}>{hobby?.label || 'Browse'}</div>
          <button className="icon-btn" onClick={() => setEditingId('new')}><Icon name="plus" size={18} /></button>
        </div>
        {ownedFactions.length || generalCount ? (
          <div className="faction-tiles">
            {ownedFactions.map((f) => (
              <FactionDashTile key={f.id} f={f} count={factionCounts.get(f.id)} label={f.label} onClick={() => setBrowseFactionId(f.id)} />
            ))}
            {generalCount > 0 && (
              <FactionDashTile f={{ color: 'var(--ink-dim)' }} count={generalCount} label="General" icon={<Icon name="paintdrop" size={22} />} onClick={() => setBrowseFactionId('__general__')} />
            )}
          </div>
        ) : (
          <EmptyState icon="paintdrop" title="Nothing logged yet" sub={`Tap + to log your first ${(hobby?.groupLabel || 'project').toLowerCase()}.`} />
        )}
      </div>
    );
  }

  // --- Level 2: the entry list, scoped to whatever was picked above -----
  const scopedEntries = isFlatAll ? entries : entries.filter((e) => (
    browseFactionId === '__general__' ? e.hobbyId === browseHobbyId && !e.factionId : e.hobbyId === browseHobbyId && e.factionId === browseFactionId
  ));
  const filtered = filter === 'all' ? scopedEntries : scopedEntries.filter((e) => e.status === filter);
  const countFor = (s) => scopedEntries.filter((e) => e.status === s).length;
  const titleLabel = isFlatAll ? 'All entries' : browseFactionId === '__general__' ? 'General' : (findFaction(browseFactionId)?.label || 'Entries');
  const goBack = () => (isFlatAll ? setBrowseHobbyId(null) : setBrowseFactionId(null));

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={goBack}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{titleLabel}</div>
        <button className="icon-btn" onClick={() => setEditingId('new')}><Icon name="plus" size={18} /></button>
      </div>
      {isFlatAll && (
        <div className="detail-sub" style={{ marginBottom: 14 }}>
          Track what you're painting project by project, separate from the step-by-step recipes themselves.
          Mark public entries to share them on your profile.
        </div>
      )}

      <div className="lib-filter-seg lib-filter-seg--wrap">
        <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>All <span className="b">{scopedEntries.length}</span></button>
        {STATUSES.map((s) => (
          <button key={s.id} className={filter === s.id ? 'is-active' : ''} onClick={() => setFilter(s.id)}>{s.label} <span className="b">{countFor(s.id)}</span></button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyState icon="paintdrop" title="Nothing here yet" sub="Tap + to log a project you're working on." />
      ) : (
        <div className="hobbylog-list">
          {filtered.map((entry) => <EntryCard key={entry.id} entry={entry} onEdit={setEditingId} />)}
        </div>
      )}
    </div>
  );
}

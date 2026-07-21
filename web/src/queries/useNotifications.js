import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}

function fromRemoteNotification(row) {
  return {
    id: row.id,
    actorId: row.actor_id,
    type: row.type,
    recipeOwnerId: row.recipe_owner_id,
    recipeId: row.recipe_id,
    commentId: row.comment_id,
    paintNoteId: row.paint_note_id,
    paintKey: row.paint_key,
    read: !!row.read,
    createdAt: row.created_at,
  };
}

// Rows here are only ever created by the DB triggers in schema.sql
// (notify_on_recipe_comment / notify_on_paint_note / notify_on_paint_rating)
// -- there's no push counterpart, just this read and the two read-flag
// writes below. Actor profiles aren't denormalized onto the row, so this
// resolves them here too, directly onto each notification -- simpler than
// a separate profile-cache layer for now (recipe/paint name resolution for
// the notification text is deferred until those data layers exist, Stage 3).
export function useNotifications() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      const notifications = (data || []).map(fromRemoteNotification);

      const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean))];
      let actors = {};
      if (actorIds.length) {
        const { data: profRows } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').in('user_id', actorIds);
        actors = Object.fromEntries((profRows || []).map((row) => [
          row.user_id,
          { displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isAdmin: !!row.is_admin },
        ]));
      }
      return notifications.map((n) => ({ ...n, actor: actors[n.actorId] || { displayName: 'Someone', avatarUrl: null, isAdmin: false } }));
    },
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id).eq('recipient_id', userId);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['notifications', userId], (prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId).eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.setQueryData(['notifications', userId], (prev) => prev?.map((n) => ({ ...n, read: true })));
    },
  });
}

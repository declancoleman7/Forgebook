import { useQuery } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { fromRemoteRecipe } from './useRecipes.js';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}

// The signed-out share-link routes (/r/:authorId/:id, and /u/:id when
// there's no session -- see App.jsx) -- deliberately independent of
// useAuth()/isSignedIn: RLS already allows anyone to read a *published*
// recipe/profile's public rows, matching the old app's fetchPublicRecipe/
// fetchPublicProfile which never checked auth state either.
export function usePublicRecipe(authorId, id) {
  return useQuery({
    queryKey: ['publicRecipe', authorId, id],
    queryFn: async () => {
      const { data: row, error } = await supabase.from('recipes').select('*').eq('user_id', authorId).eq('id', id).maybeSingle();
      if (error || !row) return null;
      const recipe = { ...fromRemoteRecipe(row), authorId };
      const [paintsRes, profRes] = await Promise.all([
        supabase.from('paints').select('*').eq('user_id', authorId),
        supabase.from('profiles').select('display_name, avatar_path').eq('user_id', authorId).maybeSingle(),
      ]);
      const paints = (paintsRes.data || []).map((p) => ({ id: p.id, name: p.name, brand: p.brand, hex: p.hex, type: p.type }));
      return {
        recipe, paints,
        authorName: profRes.data?.display_name || 'Someone',
        authorAvatarUrl: profRes.data?.avatar_path ? avatarUrl(profRes.data.avatar_path) : null,
      };
    },
    enabled: !!authorId && !!id,
  });
}

export function usePublicProfile(id) {
  return useQuery({
    queryKey: ['publicProfile', id],
    queryFn: async () => {
      const [profRes, recipesRes] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_path').eq('user_id', id).maybeSingle(),
        supabase.from('recipes').select('*').eq('user_id', id).eq('published', true).eq('deleted', false),
      ]);
      if (!profRes.data) return null;
      return {
        userId: id,
        displayName: profRes.data.display_name,
        avatarUrl: profRes.data.avatar_path ? avatarUrl(profRes.data.avatar_path) : null,
        recipes: (recipesRes.data || []).map((row) => ({ ...fromRemoteRecipe(row), authorId: id })),
      };
    },
    enabled: !!id,
  });
}

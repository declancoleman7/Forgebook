import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

// Which extra hobbies (besides the always-on Warhammer) this account has
// opted into -- see HOBBIES/enabledHobbyIds() in the old app's data.js/
// app.js. Warhammer itself is never stored here (it's always enabled), so
// it's prepended client-side, same as the old enabledHobbyIds().
export function useMyHobbies() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['myHobbies', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', userId);
      if (error) throw error;
      return ['warhammer', ...new Set((data || []).map((row) => row.hobby_id))];
    },
    enabled: !!userId,
  });
}

export function useAddHobby() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hobbyId) => {
      const { error } = await supabase.from('user_hobbies').upsert({ user_id: userId, hobby_id: hobbyId });
      if (error) throw new Error("Couldn't add that hobby — try again.");
      return hobbyId;
    },
    onSuccess: (hobbyId) => {
      qc.setQueryData(['myHobbies', userId], (prev) => (prev ? [...new Set([...prev, hobbyId])] : prev));
    },
  });
}

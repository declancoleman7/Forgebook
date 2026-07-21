import { useMutation } from '@tanstack/react-query';
import { supabase } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

// Shared by recipe comments and paint notes (see ReportDialog.jsx). A
// unique-violation means this person already reported this exact item --
// treated as a soft success ("thanks, already noted") rather than a
// surfaced error, same as the old app's reportContent().
export function useReportContent() {
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async ({ contentType, contentId, reason }) => {
      const { error } = await supabase.from('reports').insert({
        content_type: contentType, content_id: contentId, reporter_id: userId, reason: reason || null,
      });
      if (error) {
        if (error.code === '23505') return { alreadyReported: true };
        throw new Error("Couldn't send that report — try again.");
      }
      return { alreadyReported: false };
    },
  });
}

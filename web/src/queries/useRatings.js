import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { paintKey } from '../data/paints.js';

function fromRemoteRating(row) {
  return { paintKey: row.paint_key, stars: row.stars, updatedAt: row.updated_at, userId: row.user_id };
}

export function useMyRatings() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['myRatings', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paint_ratings').select('*').eq('user_id', userId).eq('deleted', false);
      if (error) throw error;
      return (data || []).map(fromRemoteRating);
    },
    enabled: !!userId,
  });
}

// Site-wide avg+count per paint_key -- schema.sql's paint_rating_summary
// view, one call instead of one per paint.
export function useRatingSummary() {
  return useQuery({
    queryKey: ['ratingSummary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('paint_rating_summary').select('*');
      if (error) throw error;
      return (data || []).map((row) => ({ paintKey: row.paint_key, avgStars: row.avg_stars, ratingCount: row.rating_count }));
    },
  });
}

// One rating per user per paint -- upsert covers both "rate for the first
// time" and "change your rating." Optimistic on both your own rating AND
// (approximately) the site-wide summary, same double-write shape as
// useVoteRecipe -- the recomputed average here is an approximation of the
// server's round(avg(stars), 2), close enough to display instantly and
// self-corrects on the next real fetch.
export function useRatePaint() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, brand, stars }) => {
      const key = paintKey(name, brand);
      const { error } = await supabase.from('paint_ratings').upsert({ paint_key: key, user_id: userId, stars, updated_at: new Date().toISOString() });
      if (error) throw new Error("Couldn't save that rating — try again.");
    },
    onMutate: async ({ name, brand, stars }) => {
      const key = paintKey(name, brand);
      await qc.cancelQueries({ queryKey: ['myRatings', userId] });
      await qc.cancelQueries({ queryKey: ['ratingSummary'] });
      const prevMine = qc.getQueryData(['myRatings', userId]);
      const prevSummary = qc.getQueryData(['ratingSummary']);
      const oldStars = prevMine?.find((r) => r.paintKey === key)?.stars ?? null;

      qc.setQueryData(['myRatings', userId], (prev = []) => {
        const rest = prev.filter((r) => r.paintKey !== key);
        return [...rest, { paintKey: key, stars }];
      });
      qc.setQueryData(['ratingSummary'], (prev = []) => {
        const idx = prev.findIndex((s) => s.paintKey === key);
        if (idx === -1) return [...prev, { paintKey: key, avgStars: stars, ratingCount: 1 }];
        const s = prev[idx];
        const nextCount = oldStars == null ? s.ratingCount + 1 : s.ratingCount;
        const total = (oldStars == null ? s.avgStars * s.ratingCount : s.avgStars * s.ratingCount - oldStars) + stars;
        const next = [...prev];
        next[idx] = { ...s, ratingCount: nextCount, avgStars: nextCount ? total / nextCount : 0 };
        return next;
      });
      return { prevMine, prevSummary };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prevMine) qc.setQueryData(['myRatings', userId], ctx.prevMine);
      if (ctx?.prevSummary) qc.setQueryData(['ratingSummary'], ctx.prevSummary);
    },
  });
}

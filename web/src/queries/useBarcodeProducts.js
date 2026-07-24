import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

function fromRemote(row) {
  return {
    barcode: row.barcode, name: row.name, category: row.category || null,
    quantity: row.quantity || null, factionId: row.faction_id || null, hobbyId: row.hobby_id || null,
  };
}

// A crowdsourced barcode -> product lookup (see schema.sql's own comment on
// why this can't just be a generic UPC-lookup API call). Exported as a
// plain async function (not just the hook below) so the barcode scanner's
// one-shot "I just decoded this, what is it" moment -- triggered from an
// event handler, not a render -- doesn't have to fight React's rules of
// hooks to get an answer.
export async function lookupBarcodeProduct(barcode) {
  const { data, error } = await supabase.from('barcode_products').select('*').eq('barcode', barcode).maybeSingle();
  if (error) throw error;
  return data ? fromRemote(data) : null;
}

// Reactive version of the same lookup, for anywhere that wants it cached/
// watched instead of a one-shot call -- enabled only once there's an actual
// barcode to look up, same "don't fire until there's something to ask"
// convention useSearchProfiles/useWantToBuy already use.
export function useLookupBarcode(barcode) {
  return useQuery({
    queryKey: ['barcodeProduct', barcode],
    queryFn: () => lookupBarcodeProduct(barcode),
    enabled: !!barcode,
  });
}

// Teaches (or corrects) what a barcode is -- an upsert, not an insert, so
// scanning something already known but mislabelled can just be fixed by
// whoever noticed, rather than needing an admin review step first.
export function useContributeBarcodeProduct() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ barcode, name, category, quantity, factionId, hobbyId }) => {
      const { error } = await supabase.from('barcode_products').upsert({
        barcode, name, category: category || null, quantity: quantity || null,
        faction_id: factionId || null, hobby_id: hobbyId || null,
        contributed_by: userId, updated_at: new Date().toISOString(),
      });
      if (error) throw new Error("Couldn't save that — try again.");
      return { barcode, name, category, quantity, factionId, hobbyId };
    },
    onSuccess: (row) => {
      qc.setQueryData(['barcodeProduct', row.barcode], row);
    },
  });
}

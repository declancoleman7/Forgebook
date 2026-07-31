// Self-service "delete my account" -- the one thing the browser client can
// never do on its own: deleting an auth.users row requires the service_role
// key, which must never reach a browser (see web/src/supabase.js's own
// warning). This function is the only place in Forgebook that key is used.
//
// Not deployed automatically -- there's no CI step or CLI link for this
// project yet, so after editing this file, paste it into the Supabase
// dashboard: Edge Functions -> delete-account -> paste -> Deploy updates
// (or create it fresh via "Deploy a new function" -> "Via Editor" the
// first time). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are both
// auto-injected into every Edge Function's environment by Supabase itself
// -- nothing to configure by hand.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Not signed in.');

    // Scoped to the CALLER's own token -- used only to ask "who am I",
    // never to touch anyone else's data. This is what makes it impossible
    // to delete an arbitrary account: the id this function acts on always
    // comes from the caller's own verified session, never from anything
    // the client could put in a request body.
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) throw new Error('Not signed in.');

    // The only place in this codebase the service_role key is used --
    // this is what can actually delete an auth.users row and reach into
    // every user's own storage folder, bypassing RLS entirely.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Storage objects aren't touched by Postgres's own "on delete cascade"
    // -- a recipe/avatar row disappearing doesn't remove the file it
    // pointed at, so any photo would otherwise sit in storage forever with
    // nothing left pointing at it. Both buckets are organised as
    // {user_id}/filename (see schema.sql's own storage policies), so a
    // single-level list() finds everything this account ever uploaded.
    // The Pile of Potential reuses the recipe-photos bucket rather than
    // having a bucket of its own, so that one covers both.
    for (const bucket of ['recipe-photos', 'avatar-photos']) {
      const { data: files } = await adminClient.storage.from(bucket).list(user.id);
      if (files?.length) {
        await adminClient.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
      }
    }

    // Cascades through recipes, paints, the paint rack, hobby log entries
    // and projects, comments, notes, ratings, votes, saves, follows, and
    // the profiles row -- every "user_id references auth.users on delete
    // cascade" foreign key in schema.sql. A handful of columns
    // (copied_from_owner_id, resolved_by, reviewed_by, updated_by,
    // actor_id) are "on delete set null" by design instead -- they
    // anonymise rather than cascade, so e.g. a recipe someone else copied
    // from this account keeps its name-only attribution snapshot even
    // after this runs, and a report this account resolved as an admin
    // still exists, just with resolved_by cleared.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

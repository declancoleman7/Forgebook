// Same two values as the old js/config.js -- safe to commit, the
// publishable (anon) key is designed to be sent to browsers and grants no
// access on its own. What actually protects data is Row Level Security in
// Postgres (supabase/schema.sql), unchanged by this migration.
//
// NEVER put the `service_role` key here. That one bypasses all security and
// must stay on a server, or nowhere at all.
import { createClient as realCreateClient } from '@supabase/supabase-js';

export const CONFIG = {
  supabaseUrl: 'https://ddvvwmmhgriyfccxbvlf.supabase.co',
  supabaseKey: 'sb_publishable_UwzAFopn0lOTTl5n6WSMAA_cxRnWXTF',
  photoBucket: 'recipe-photos', // finished-mini photos, see schema.sql
};

// The old vanilla app's mock-supabase-live.js test harness worked by
// intercepting the network request for the CDN <script> tag and swapping in
// a fake window.supabase.createClient -- there's no such request to
// intercept anymore now that @supabase/supabase-js is a bundled npm import,
// so instead: if a test has injected window.supabase.createClient (via
// page.evaluateOnNewDocument, which runs before this module does), use that
// instead of the real client. mock-supabase-live.js itself needs no changes
// -- it already sets exactly this global.
const createClient =
  typeof window !== 'undefined' && window.supabase && window.supabase.createClient
    ? window.supabase.createClient
    : realCreateClient;

export const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

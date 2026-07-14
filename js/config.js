// ============================================================
// Forgebook — configuration
//
// These two values are safe to commit to a public repo. The publishable
// (anon) key is designed to be sent to browsers; it grants no access on its
// own. What actually protects your data is Row Level Security in Postgres,
// which is set up in supabase/schema.sql.
//
// NEVER put the `service_role` key in here. That one bypasses all security
// and must stay on a server, or nowhere at all.
// ============================================================

const CONFIG = {
  supabaseUrl: "https://ddvvwmmhgriyfccxbvlf.supabase.co",
  supabaseKey: "sb_publishable_UwzAFopn0lOTTl5n6WSMAA_cxRnWXTF",

  // Bucket used for finished-mini photos (see schema.sql)
  photoBucket: "recipe-photos",
};

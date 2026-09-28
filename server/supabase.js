const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

let rawUrl = process.env.SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Handle Postgres connection string format (e.g. postgresql://postgres.PROJECT_ID:pass@...)
let formattedUrl = rawUrl.trim();
if (formattedUrl.startsWith('postgresql://') || formattedUrl.startsWith('postgres://')) {
  const match = formattedUrl.match(/postgres\.([a-zA-Z0-9_-]+):/);
  if (match && match[1]) {
    formattedUrl = `https://${match[1]}.supabase.co`;
  }
}

let supabase = null;
let isSupabaseConfigured = false;

if (formattedUrl && rawKey && formattedUrl.startsWith('http')) {
  try {
    supabase = createClient(formattedUrl, rawKey, {
      auth: {
        persistSession: false
      }
    });
    isSupabaseConfigured = true;
    console.log(`[SUPABASE] Connected to ${formattedUrl}`);
  } catch (err) {
    console.error('[SUPABASE] Initialization error:', err.message);
  }
} else {
  console.log('[SUPABASE] Running in unified database mode.');
}

module.exports = {
  supabase,
  isSupabaseConfigured,
  SUPABASE_URL: formattedUrl
};

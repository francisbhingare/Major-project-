/**
 * Supabase DB Client Abstraction
 */

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    !url.includes('your_supabase_url') &&
    url.startsWith('http') &&
    key &&
    !key.includes('your_supabase') &&
    key.trim().length > 10
  );
};

export const getSupabaseConfig = () => {
  return {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    configured: isSupabaseConfigured(),
  };
};


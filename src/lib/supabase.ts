import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dmoysniqpyerswmhdflk.supabase.co';

const cleanSupabaseUrl = (urlStr: string): string => {
  if (!urlStr) return 'https://dmoysniqpyerswmhdflk.supabase.co';
  let cleaned = urlStr.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  try {
    return new URL(cleaned).origin;
  } catch {
    return cleaned;
  }
};

const supabaseUrl = cleanSupabaseUrl(rawUrl);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vN9dAc3LXNJ_M-jIYRhPWA_QIa_wFjO').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});



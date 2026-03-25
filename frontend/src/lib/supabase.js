import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase ENV:', {
    url: supabaseUrl,
    key: supabaseAnonKey,
  });

  throw new Error('Supabase credentials missing. Check frontend/.env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
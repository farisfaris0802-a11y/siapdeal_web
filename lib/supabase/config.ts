const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}

export const SUPABASE_SETUP_MESSAGE =
  "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env.local.";

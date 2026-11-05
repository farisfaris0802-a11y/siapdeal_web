import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseEnv, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  const cookieStore = cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Dipanggil dari Server Component — cookie hanya bisa ditulis
          // dari Server Action atau Route Handler. Aman untuk diabaikan.
        }
      },
    },
  });
}

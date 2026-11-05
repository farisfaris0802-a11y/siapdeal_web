"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  browserClient = createBrowserClient(env.url, env.anonKey);
  return browserClient;
}

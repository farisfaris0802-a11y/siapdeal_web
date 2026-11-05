import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function getCurrentUser(): Promise<{
  user: User | null;
  configured: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { user: null, configured: false };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user, configured: true };
  } catch {
    return { user: null, configured: false };
  }
}

export async function requireUser(): Promise<User> {
  const { user, configured } = await getCurrentUser();

  if (!configured) {
    redirect("/login?setup=1");
  }

  if (!user) {
    redirect("/login");
  }

  return user;
}

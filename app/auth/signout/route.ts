import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/", new URL(request.url).origin), {
    status: 303,
  });
}

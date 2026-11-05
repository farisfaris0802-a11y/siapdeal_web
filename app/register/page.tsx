import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Daftar",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const { user } = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Mulai latihan pertama"
      subtitle="Buat akun gratis dan siapkan skenario negosiasi pertama Anda dalam hitungan menit."
    >
      <AuthForm
        mode="register"
        nextPath={searchParams.next}
        configured={isSupabaseConfigured()}
      />
    </AuthShell>
  );
}

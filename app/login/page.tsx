import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { JudgeLoginButton } from "@/components/auth/judge-login-button";
import { getCurrentUser } from "@/lib/auth";
import { judgeLoginAction } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Masuk",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: {
    next?: string;
    setup?: string;
    error?: string;
    detail?: string;
  };
}) {
  const { user } = await getCurrentUser();
  if (user) redirect("/dashboard");

  const notice =
    searchParams.error === "auth"
      ? "Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Silakan coba masuk kembali."
      : searchParams.error === "judge"
        ? "Quick Demo Login belum berhasil. Pastikan Anonymous Sign-In aktif di Supabase, atau isi akun demo pada environment variables."
        : searchParams.setup === "1"
          ? "Aplikasi belum terhubung ke Supabase. Ikuti panduan pada README untuk menyelesaikan konfigurasi."
          : null;

  return (
    <AuthShell
      title="Selamat datang kembali"
      subtitle="Masuk untuk melanjutkan latihan negosiasi dan melihat perkembangan skor Anda."
    >
      <AuthForm
        mode="login"
        nextPath={searchParams.next}
        configured={isSupabaseConfigured()}
        initialNotice={notice}
      />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[10px] font-medium text-muted-foreground">
            Atau untuk mode demo
          </span>
        </div>
      </div>

      <form action={judgeLoginAction} className="space-y-2.5">
        <input type="hidden" name="next" value="/simulasi/baru?demo=1" />
        <JudgeLoginButton
          label="Masuk instan sebagai Demo"
          size="lg"
          variant="outline"
          className="w-full border-primary/25 bg-white"
        />
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Tanpa registrasi. Skenario contoh Bali sudah disiapkan otomatis.
        </p>
      </form>
    </AuthShell>
  );
}

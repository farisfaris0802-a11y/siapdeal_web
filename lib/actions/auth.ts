"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  SUPABASE_SETUP_MESSAGE,
} from "@/lib/supabase/config";

type AuthState = {
  error: string | null;
  message: string | null;
};

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "Email atau password salah. Periksa kembali lalu coba lagi.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Buka tautan di inbox email Anda terlebih dahulu.";
  }
  if (
    normalized.includes("email logins are disabled") ||
    normalized.includes("email signups are disabled") ||
    normalized.includes("email provider is disabled")
  ) {
    return "Login email belum diaktifkan di Supabase. Buka Dashboard Supabase → Authentication → Providers → Email, aktifkan provider Email, lalu coba lagi.";
  }
  if (normalized.includes("already registered")) {
    return "Email ini sudah terdaftar. Silakan masuk.";
  }
  if (normalized.includes("password should be at least")) {
    return "Password minimal 6 karakter.";
  }
  if (normalized.includes("rate limit")) {
    return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  }
  return message;
}

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {  if (!isSupabaseConfigured()) {
    return { error: SUPABASE_SETUP_MESSAGE, message: null };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Email dan password wajib diisi.", message: null };
  }

  let shouldRedirect = false;

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: friendlyAuthError(error.message), message: null };
    }

    shouldRedirect = true;
  } catch (error) {
    console.error("[auth] sign in", error);
    return {
      error: "Gagal masuk. Periksa koneksi lalu coba lagi.",
      message: null,
    };
  }

  if (shouldRedirect) {
    redirect(next);
  }

  return { error: "Gagal masuk. Silakan coba lagi.", message: null };
}

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: SUPABASE_SETUP_MESSAGE, message: null };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) {
    return { error: "Nama lengkap minimal 2 karakter.", message: null };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid.", message: null };
  }
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter.", message: null };
  }

  let hasSession = false;
  let confirmationSent = false;

  try {
    const originHeader = headers().get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || originHeader || "http://localhost:3000";

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${appUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      return { error: friendlyAuthError(error.message), message: null };
    }

    if (data.session) {
      hasSession = true;
    } else {
      confirmationSent = true;
    }
  } catch (error) {
    console.error("[auth] sign up", error);
    return {
      error: "Gagal mendaftar. Periksa koneksi lalu coba lagi.",
      message: null,
    };
  }

  if (hasSession) {
    redirect("/dashboard");
  }

  if (confirmationSent) {
    return {
      error: null,
      message:
        "Pendaftaran berhasil! Silakan buka email untuk mengonfirmasi akun, lalu masuk.",
    };
  }

  return { error: "Pendaftaran gagal. Silakan coba lagi.", message: null };
}

/**
 * Quick Demo Login untuk juri Bali DigiFest.
 *
 * Urutan upaya:
 * 1. Jika sudah login, langsung masuk ke tujuan.
 * 2. Akun demo tetap (DEMO_JUDGE_EMAIL/PASSWORD) — stabil untuk juri.
 * 3. Supabase Anonymous Sign-In — tanpa registrasi, cukup satu klik.
 *
 * Anonymous user mendapat role `authenticated` dan auth.uid(), sehingga
 * seluruh RLS tetap berlaku dan data antar-juri tetap terisolasi.
 */
export async function judgeLoginAction(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next") ?? "/simulasi/baru?demo=1");

  if (!isSupabaseConfigured()) {
    redirect("/login?setup=1");
  }

  const supabase = createClient();
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser) {
    redirect(next);
  }

  const demoEmail = process.env.DEMO_JUDGE_EMAIL;
  const demoPassword = process.env.DEMO_JUDGE_PASSWORD;
  const errors: string[] = [];
  let demoSuccess = false;
  let anonymousSuccess = false;

  if (demoEmail && demoPassword) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (!error) {
        demoSuccess = true;
      } else {
        errors.push(`demo-account: ${error.message}`);
        console.warn("[auth] judge demo account failed", error.message);
      }
    } catch (error) {
      errors.push(`demo-account: ${String(error)}`);
      console.warn("[auth] judge demo account threw", error);
    }
  }

  if (demoSuccess) {
    redirect(next);
  }

  if (process.env.JUDGE_ANONYMOUS_ENABLED !== "false") {
    try {
      const { error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            full_name: "Juri DigiFest",
            role: "judge",
            event: "Bali DigiFest 2026",
          },
        },
      });

      if (!error) {
        anonymousSuccess = true;
      } else {
        errors.push(`anonymous: ${error.message}`);
        console.warn("[auth] anonymous judge login failed", error.message);
      }
    } catch (error) {
      errors.push(`anonymous: ${String(error)}`);
      console.warn("[auth] anonymous judge login threw", error);
    }
  }

  if (anonymousSuccess) {
    redirect(next);
  }

  const detail = encodeURIComponent(errors.join(" | ").slice(0, 240));
  redirect(`/login?error=judge&detail=${detail}`);
}


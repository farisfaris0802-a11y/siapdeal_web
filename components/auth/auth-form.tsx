"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  User,
} from "lucide-react";

import { signInAction, signUpAction } from "@/lib/actions/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: null as string | null, message: null as string | null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Memproses…
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export function AuthForm({
  mode,
  nextPath,
  configured,
  initialNotice,
}: {
  mode: "login" | "register";
  nextPath?: string;
  configured: boolean;
  initialNotice?: string | null;
}) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction] = useFormState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  return (
    <div className="space-y-5">
      {!configured && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supabase belum dikonfigurasi</AlertTitle>
          <AlertDescription>
            Tambahkan <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            dan{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            pada file <code className="font-mono text-xs">.env.local</code>, lalu
            jalankan migration di folder{" "}
            <code className="font-mono text-xs">supabase/migrations</code>.
          </AlertDescription>
        </Alert>
      )}

      {initialNotice && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>{initialNotice}</AlertDescription>
        </Alert>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tidak berhasil</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.message && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath ?? "/dashboard"} />

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama lengkap</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="full_name"
                name="full_name"
                placeholder="Nama Anda"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                className="pl-10"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@usaha.com"
              autoComplete="email"
              required
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!isLogin && (
              <span className="text-[11px] text-muted-foreground">Min. 8 karakter</span>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={isLogin ? "Password Anda" : "Buat password yang aman"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={isLogin ? 6 : 8}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <SubmitButton label={isLogin ? "Masuk" : "Buat akun"} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {isLogin ? "Daftar gratis" : "Masuk di sini"}
        </Link>
      </p>

      {!isLogin && (
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Dengan mendaftar, Anda setuju bahwa penilaian AI adalah alat bantu
          latihan dan bukan jaminan hasil negosiasi nyata.
        </p>
      )}
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div className="pointer-events-none absolute inset-0 grain opacity-40" />

      <div className="relative flex flex-col items-center text-center">
        <Logo />
        <span className="mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary shadow-soft ring-1 ring-border">
          <Compass className="h-6 w-6" />
        </span>
        <p className="mt-6 font-display text-6xl font-bold tracking-tight text-foreground">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Sepertinya tautan yang Anda buka sudah dipindahkan atau sesi simulasi
          tidak tersedia untuk akun ini.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Buka beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

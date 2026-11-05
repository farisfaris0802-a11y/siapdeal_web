"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-white p-8 text-center shadow-soft">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-display text-xl font-bold text-ink">
          Terjadi kesalahan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Halaman gagal dimuat. Coba muat ulang. Jika masalah berlanjut, periksa konfigurasi API AI atau koneksi server.
        </p>
        <Button onClick={reset} className="mt-5">
          <RotateCcw className="h-4 w-4" />
          Coba lagi
        </Button>
      </div>
    </div>
  );
}

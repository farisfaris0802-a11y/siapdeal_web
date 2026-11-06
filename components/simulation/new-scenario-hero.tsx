"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

export function NewScenarioHero({ demo }: { demo: boolean }) {
  const { t } = useLanguage();

  return (
    <header className="relative mb-7 overflow-hidden rounded-3xl bg-[linear-gradient(125deg,hsl(var(--brand-navy)),hsl(var(--brand-navy-soft))_58%,hsl(var(--brand-teal)))] px-5 py-7 text-white shadow-soft sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute inset-0 grain opacity-25" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-brand-mint/20 blur-3xl" />

      <div className="relative">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("Kembali ke dashboard")}
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Badge className="mb-3 gap-1.5 border-white/15 bg-white/10 text-white">
              <Sparkles className="h-3 w-3 text-brand-mint" />
              {demo ? t("Mode Demo, Bali DigiFest 2026") : t("Skenario baru")}
            </Badge>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {t("Siapkan lawan negosiasi Anda.")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
              {t(
                "Isi data produk, pilih jenis mitra Bali dan tingkat kesulitan. AI akan memerankan pembeli dengan karakter, batas harga, dan tuntutan komersial yang konsisten."
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {[t("Data produk"), t("Jenis mitra"), t("Kesulitan")].map(
              (step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[10px] font-bold text-white ring-1 ring-inset ring-white/15">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-medium text-white/65">
                    {step}
                  </span>
                  {index < 2 && <span className="h-px w-4 bg-white/20" />}
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-[11px] text-white/65">
          <Target className="h-3.5 w-3.5 shrink-0 text-brand-mint" />
          {t("Pratinjau skenario")}: {t("5 aspek dinilai di akhir sesi.")}
        </div>
      </div>
    </header>
  );
}

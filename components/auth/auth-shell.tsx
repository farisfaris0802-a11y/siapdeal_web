import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Check, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/logo";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
          <Image
            src="/images/boardroom-hero-bright.jpg"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/95" />
          <div className="pointer-events-none absolute inset-0 grain opacity-25" />

          <Logo href="/" className="relative" inverted />

          <div className="relative max-w-lg">
            <BadgeCheck className="h-10 w-10 text-accent" />
            <h2 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">
              Pembeli terbaik tidak datang dua kali. Latih jawaban Anda
              sekarang.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-primary-foreground/70">
              SiapDeal menghadirkan pembeli virtual Bali yang realistis, rubrik
              penilaian tetap, dan saran kalimat yang bisa langsung Anda pakai.
            </p>

            <div className="mt-8 space-y-3.5">
              {[
                "Tiga tipe pembeli Bali: hotel resort, oleh-oleh, dan beach club",
                "Penilaian 5 aspek dengan skor 0 sampai 100",
                "Riwayat sesi dan grafik perkembangan skor",
                "Tanpa risiko merusak hubungan mitra sungguhan",
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-primary-foreground/85">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Latihan privat, tanpa risiko.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-primary-foreground/60">
              Semua sesi berjalan di ruang latihan Anda sendiri. Hubungan mitra
              nyata tidak tersentuh.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-5 sm:p-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <Link
              href="/"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Beranda
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-14 pt-4 sm:px-8">
            <div className="w-full max-w-[430px]">
              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
              </div>

              {children}

              <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Data Anda disimpan aman dan tidak dibagikan ke pihak lain.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

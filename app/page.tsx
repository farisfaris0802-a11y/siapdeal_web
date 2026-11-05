import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  Lightbulb,
  MapPin,
  MessagesSquare,
} from "lucide-react";

import { JudgeLoginButton } from "@/components/auth/judge-login-button";
import { Logo } from "@/components/logo";
import { ScoreRing } from "@/components/score-ring";
import { SiteHeader } from "@/components/site-header";
import { TransitionLink } from "@/components/transitions/pre-session-transition";
import { judgeLoginAction } from "@/lib/actions/auth";
import { RUBRIC_ASPECTS } from "@/lib/ai/personas";
import { getCurrentUser } from "@/lib/auth";

const steps = [
  {
    number: "01",
    title: "Pilih skenario",
    body: "Produk, mitra, dan level tekanan.",
    icon: Briefcase,
  },
  {
    number: "02",
    title: "Hadapi pembeli",
    body: "AI berperan sebagai buyer Bali.",
    icon: MessagesSquare,
  },
  {
    number: "03",
    title: "Tutup deal",
    body: "Skor 5 aspek dan saran konkret.",
    icon: BadgeCheck,
  },
];

function JudgeDemoForm({
  formClassName,
  buttonClassName,
}: {
  formClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <form action={judgeLoginAction} className={formClassName}>
      <input type="hidden" name="next" value="/simulasi/baru?demo=1" />
      <JudgeLoginButton
        label="Mode Demo"
        pendingLabel="Menyiapkan mode demo..."
        size="lg"
        variant="ghost"
        className={buttonClassName}
        icon="sparkles"
        transitionOnSubmit
      />
    </form>
  );
}

export default async function LandingPage() {
  const { user } = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background font-sans text-ink">
      <SiteHeader isLoggedIn={Boolean(user)} />

      <section className="relative isolate flex min-h-[85vh] flex-col overflow-hidden bg-primary text-cream sm:min-h-[calc(100svh-4rem)]">
        <Image
          src="/images/boardroom-hero-bright.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/75 to-slate-950/95" />

        <div className="container relative z-10 flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="flex items-center justify-center gap-2 text-xs font-medium text-white/70">
              <MapPin className="h-3.5 w-3.5 text-white/55" />
              Bali, Indonesia
            </p>

            <h1 className="mx-auto mt-4 max-w-4xl text-balance font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-white drop-shadow-lg sm:mt-5 sm:text-4xl md:text-6xl">
              Deal hebat
              <br className="hidden sm:block" />{" "}
              dimenangkan sebelum
              <br className="hidden sm:block" />{" "}
              meja negosiasi
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-balance text-xs leading-relaxed text-slate-200 drop-shadow-md sm:mt-6 sm:max-w-xl sm:text-sm">
              Bersama AI, latih tawar-menawar, jaga margin, dan jawab keberatan
              sebelum bertemu F&amp;B Director hotel, manajer ritel, dan owner
              beach club Bali yang sesungguhnya.
            </p>

            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 px-2 sm:flex-row sm:items-center">
              <TransitionLink
                href={user ? "/simulasi/baru" : "/register"}
                className="group inline-flex w-full items-center justify-between gap-4 rounded-xl bg-cream py-3.5 pl-6 pr-2 text-sm font-semibold text-cream-foreground shadow-2xl shadow-black/20 transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98] sm:h-14 sm:w-auto sm:min-w-[220px] sm:py-0"
              >
                <span>{user ? "Mulai simulasi" : "Mulai Gratis"}</span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-cream transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </TransitionLink>

              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-3.5 text-sm font-semibold text-cream backdrop-blur-xl transition-colors hover:bg-white/20 sm:h-14 sm:w-auto sm:py-0"
                >
                  Buka dashboard
                </Link>
              ) : (
                <JudgeDemoForm
                  formClassName="w-full sm:w-auto"
                  buttonClassName="h-auto w-full justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-3.5 text-sm font-semibold text-cream shadow-none backdrop-blur-xl hover:bg-white/20 hover:text-cream sm:h-14 sm:w-auto sm:py-0"
                />
              )}
            </div>

            <p className="mt-4 text-[11px] text-white/50">
              Tanpa registrasi. Satu klik untuk demo.
            </p>
          </div>

          <div
            id="cara-kerja"
            className="mx-auto mt-16 w-full max-w-5xl scroll-mt-24 sm:mt-auto sm:pt-20"
          >
            <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-950/40 backdrop-blur-xl">
              <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex w-full max-w-full items-start gap-4 overflow-hidden p-4 sm:p-5"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/5 text-white">
                      <step.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 break-words">
                      <p className="text-sm font-semibold text-white">
                        {step.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                        {step.body}
                      </p>
                    </div>
                    <span className="text-[10px] tabular-nums text-white/35">
                      {step.number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-2 text-[10px] text-white/45 sm:flex-row">
              <span>SiapDeal, negosiasi B2B untuk UMKM Bali</span>
              <span>Percakapan dan evaluasi dibantu AI</span>
            </div>
          </div>
        </div>
      </section>

      <section id="rubrik" className="scroll-mt-24 bg-background">
        <div className="container px-4 py-16 sm:px-6 lg:py-24">
          <div className="w-full max-w-full overflow-hidden rounded-3xl bg-primary text-cream shadow-2xl shadow-primary/10">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-7 sm:p-10 lg:p-12">
                <h2 className="max-w-lg font-display text-3xl font-semibold leading-tight tracking-tight text-cream sm:text-4xl">
                  Lima aspek yang menentukan apakah penawaran Anda layak
                  dipercaya.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream/60">
                  Rubrik yang sama dipakai di setiap sesi, sehingga skor Anda
                  bisa dibandingkan dari waktu ke waktu.
                </p>

                <div className="mt-7 space-y-0 divide-y divide-cream/10 border-y border-cream/10">
                  {RUBRIC_ASPECTS.map((aspect, index) => (
                    <div
                      key={aspect.key}
                      className="flex items-start gap-4 py-3.5"
                    >
                      <span className="font-display text-sm font-bold text-accent">
                        0{index + 1}
                      </span>
                      <div className="min-w-0 flex-1 break-words">
                        <p className="text-sm font-semibold text-cream">
                          {aspect.label}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-cream/50">
                          {aspect.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background p-7 text-ink sm:p-10 lg:p-12">
                <p className="text-sm font-semibold text-ink">
                  Contoh hasil evaluasi
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Kopi Kintamani, Hotel Resort, level menengah
                </p>

                <div className="mt-6 flex w-full flex-col items-center gap-5 sm:flex-row sm:items-center">
                  <ScoreRing score={74} size={112} strokeWidth={9} />
                  <div className="space-y-2.5">
                    {[
                      ["Kejelasan penawaran", 82],
                      ["Value proposition", 78],
                      ["Objection handling", 61],
                      ["Margin flexibility", 70],
                      ["Closing assertion", 79],
                    ].map(([label, score]) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <span className="w-24 shrink-0 break-words text-[10px] text-muted-foreground sm:w-[124px]">
                          {label}
                        </span>
                        <span className="h-1 w-12 overflow-hidden rounded-full bg-secondary">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${score}%` }}
                          />
                        </span>
                        <span className="text-[10px] font-bold text-ink">
                          {score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-7 border-t border-border pt-5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Lightbulb className="h-3.5 w-3.5 text-accent" />
                    Contoh saran perbaikan
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    “Saya bisa Rp74.000 untuk 300 pcs per bulan, asalkan TOP 30
                    hari dan kontrak 6 bulan. Gift packaging dan 20 sampel gratis
                    kami sertakan.”
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  Penilaian AI adalah panduan latihan, bukan jaminan hasil nyata.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-primary text-cream">
        <div className="container px-4 pb-20 pt-12 sm:px-6 sm:pb-12">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-sm">
              <Logo href="/" inverted />
              <p className="mt-4 text-xs leading-relaxed text-cream/50">
                AI flight simulator negosiasi B2B untuk membantu UMKM Bali masuk
                jalur retail dan hospitality dengan lebih percaya diri.
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-[10px] text-cream/45">
                <Award className="h-3 w-3 text-accent" />
                Bali DigiFest 2026, AI Web Innovation Challenge
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-xs">
              <div>
                <p className="font-semibold text-cream">Produk</p>
                <div className="mt-3 space-y-2 text-cream/50">
                  <Link href="/simulasi/baru" className="block hover:text-cream">
                    Simulasi baru
                  </Link>
                  <Link href="/dashboard" className="block hover:text-cream">
                    Dashboard
                  </Link>
                  <a href="#rubrik" className="block hover:text-cream">
                    Rubrik penilaian
                  </a>
                </div>
              </div>
              <div>
                <p className="font-semibold text-cream">Akun</p>
                <div className="mt-3 space-y-2 text-cream/50">
                  <Link href="/login" className="block hover:text-cream">
                    Masuk
                  </Link>
                  <Link href="/register" className="block hover:text-cream">
                    Daftar
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-between gap-2 border-t border-cream/10 pt-5 text-[10px] text-cream/35 sm:flex-row">
            <p>© {new Date().getFullYear()} SiapDeal. Dibuat untuk UMKM Bali.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

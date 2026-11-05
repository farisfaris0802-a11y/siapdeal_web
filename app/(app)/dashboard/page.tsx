import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CirclePlay,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Hotel,
  Lightbulb,
  Plus,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Waves,
} from "lucide-react";

import { ScoreChart } from "@/components/score-chart";
import { DashboardSoundToggle } from "@/components/dashboard/dashboard-effects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransitionLink } from "@/components/transitions/pre-session-transition";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { DIFFICULTY_META, PARTNER_META, RUBRIC_ASPECTS } from "@/lib/ai/personas";
import { getSessionsForUser } from "@/lib/queries";
import type { SessionWithRelations } from "@/lib/types";
import { cn, formatDate, formatRelative, formatRupiah, scoreTone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function evaluationOf(session: SessionWithRelations) {
  const embedded = session.evaluations;
  if (!embedded) return null;
  const evaluation = Array.isArray(embedded) ? embedded[0] : embedded;
  return evaluation ?? null;
}

function outcomeBadge(outcome: SessionWithRelations["outcome"]) {
  if (outcome === "deal") return { label: "Sepakat", variant: "success" as const };
  if (outcome === "no_deal") return { label: "Tidak sepakat", variant: "destructive" as const };
  if (outcome === "manual") return { label: "Manual", variant: "muted" as const };
  return null;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const sessions = await getSessionsForUser(user.id);

  const evaluated = sessions
    .map((session) => ({ session, evaluation: evaluationOf(session) }))
    .filter(
      (item): item is { session: SessionWithRelations; evaluation: NonNullable<ReturnType<typeof evaluationOf>> } =>
        Boolean(item.evaluation)
    );

  const scores = evaluated.map((item) => item.evaluation.rubric_scores.overall);
  const averageScore = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : null;
  const bestScore = scores.length ? Math.max(...scores) : null;

  const chronological = [...evaluated].reverse();
  const firstScore = chronological[0]?.evaluation.rubric_scores.overall ?? null;
  const latestScore = chronological[chronological.length - 1]?.evaluation.rubric_scores.overall ?? null;
  const scoreDelta =
    firstScore !== null && latestScore !== null && chronological.length > 1
      ? latestScore - firstScore
      : null;

  const chartData = chronological.slice(-12).map((item) => ({
    score: item.evaluation.rubric_scores.overall,
    date: item.session.created_at,
  }));

  const aspectAverages = RUBRIC_ASPECTS.map((aspect) => {
    const values = evaluated
      .map((item) =>
        item.evaluation.rubric_scores.aspects.find((entry) => entry.key === aspect.key)
      )
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .map((entry) => entry.score);

    return {
      ...aspect,
      average: values.length
        ? Math.round(values.reduce((total, value) => total + value, 0) / values.length)
        : null,
    };
  });

  const focusAspect = aspectAverages
    .filter((aspect) => aspect.average !== null)
    .sort((a, b) => (a.average ?? 0) - (b.average ?? 0))[0];

  const activeSessions = sessions.filter((session) => session.status === "active");
  const averageTone = averageScore !== null ? scoreTone(averageScore) : null;

  const stats = [
    {
      label: "Total sesi",
      value: String(sessions.length),
      note: `${sessions.filter((session) => session.status === "completed").length} sesi selesai`,
      icon: ClipboardList,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Rata-rata skor",
      value: averageScore !== null ? String(averageScore) : "—",
      note: averageScore !== null ? averageTone?.label ?? "dari 100" : "Belum ada evaluasi",
      icon: BarChart3,
      tone: "bg-brand-navy/5 text-brand-navy-soft",
    },
    {
      label: "Skor terbaik",
      value: bestScore !== null ? String(bestScore) : "—",
      note: bestScore !== null ? "dari seluruh sesi" : "Selesaikan satu sesi",
      icon: Trophy,
      tone: "bg-brand-teal/10 text-brand-navy",
    },
    {
      label: "Perkembangan",
      value: scoreDelta !== null ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta}` : "—",
      note:
        scoreDelta !== null
          ? "poin dari sesi pertama"
          : "Butuh minimal 2 sesi dinilai",
      icon: TrendingUp,
      tone: "bg-brand-teal/10 text-brand-navy",
    },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      {/* Page header */}
      <header className="relative mb-7 animate-in-up overflow-hidden rounded-3xl motion-reduce:animate-none">
        <Image
          src="/images/boardroom-hero-bright.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1000px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/35" />
        <div className="relative flex flex-col justify-between gap-5 p-6 text-cream sm:flex-row sm:items-end sm:p-8">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-cream/70">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(new Date())}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
              Meja negosiasi
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/70">
              {sessions.length === 0
                ? "Siap memulai latihan negosiasi pertama Anda? Pilih skenario, hadapi mitra virtual, lalu lihat skor deal Anda."
                : "Pantau perkembangan negosiasi, bandingkan skor, dan lanjutkan latihan berikutnya."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DashboardSoundToggle className="border-white/20 bg-white/10 text-cream hover:bg-white/20 hover:text-cream" />
            <Button
              asChild
              variant="outline"
              className="hidden border-white/20 bg-white/10 text-cream hover:bg-white/20 hover:text-cream sm:inline-flex"
            >
              <Link href="/evaluasi">
                <ClipboardCheck className="h-4 w-4" />
                Evaluasi
              </Link>
            </Button>
            <Button
              asChild
              className="border border-white/20 bg-cream text-cream-foreground hover:bg-cream/90"
            >
              <TransitionLink href="/simulasi/baru">
                <Plus className="h-4 w-4" />
                Simulasi Baru
              </TransitionLink>
            </Button>
          </div>
        </div>
      </header>

      {/* Active session */}
      {activeSessions.length > 0 && (
        <Link
          href={`/simulasi/${activeSessions[0].id}`}
          className="group mb-5 flex animate-in-up animate-delay-1 flex-col justify-between gap-3 rounded-2xl border border-brand-teal/25 bg-brand-teal/10 p-4 transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand-teal/15 motion-reduce:animate-none sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-teal/15 text-brand-navy">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-brand-navy">
                Ada sesi yang belum selesai
              </p>
              <p className="mt-0.5 text-xs text-brand-navy/70">
                {activeSessions[0].products?.name ?? "Sesi simulasi"},{" "}
                {activeSessions[0].buyer_personas
                  ? PARTNER_META[activeSessions[0].buyer_personas.partner_type].shortLabel
                  : "Mitra"}
                {", dimulai "}
                {formatRelative(activeSessions[0].created_at)}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-brand-navy px-3 py-1.5 text-xs font-semibold text-primary-foreground sm:self-auto">
            Lanjutkan
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="animate-in-up rounded-2xl border border-border/80 bg-card p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand-teal/30 motion-reduce:animate-none"
            style={{ animationDelay: `${100 + index * 70}ms` }}
          >
            <p className="text-[11px] font-semibold text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-3 font-display text-3xl font-bold leading-none tracking-tight text-ink">
              {stat.value}
              {stat.label === "Rata-rata skor" || stat.label === "Skor terbaik" ? (
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  /100
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 text-[10px] text-muted-foreground">{stat.note}</p>
          </div>
        ))}
      </div>

      {/* Chart + focus */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="animate-in-up animate-delay-2 motion-reduce:animate-none">
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Progres skor</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Skor total dari {chartData.length} sesi terakhir yang dinilai
              </p>
            </div>
            <Badge variant="outline" className="gap-1 bg-white text-[10px]">
              <TrendingUp className="h-3 w-3 text-brand-navy" />
              {scoreDelta !== null ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta} poin` : "Mulai tracking"}
            </Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <ScoreChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="animate-in-up animate-delay-2 overflow-hidden motion-reduce:animate-none">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-teal/15 text-brand-navy">
                <Lightbulb className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base">Fokus berikutnya</CardTitle>
                <p className="text-[11px] text-muted-foreground">Aspek terlemah Anda</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {focusAspect && focusAspect.average !== null ? (
              <>
                <div className="rounded-xl border border-brand-teal/25 bg-brand-teal/10 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-brand-navy">{focusAspect.label}</p>
                    <span className="font-display text-lg font-bold text-brand-navy">
                      {focusAspect.average}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-brand-navy/70">
                    {focusAspect.description}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {aspectAverages.map((aspect) => (
                    <div key={aspect.key}>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate text-muted-foreground">{aspect.shortLabel}</span>
                        <span className="font-semibold text-ink">{aspect.average ?? "—"}</span>
                      </div>
                      <Progress
                        value={aspect.average ?? 0}
                        className="mt-1 h-1.5"
                        indicatorClassName={cn(
                          (aspect.average ?? 0) >= 80
                            ? "bg-brand-teal"
                            : (aspect.average ?? 0) >= 60
                              ? "bg-brand-navy-soft"
                              : "bg-rose-600"
                        )}
                      />
                    </div>
                  ))}
                </div>

                <Button asChild size="sm" className="w-full">
                  <TransitionLink href="/simulasi/baru">
                    Latih aspek ini
                    <ArrowRight className="h-3.5 w-3.5" />
                  </TransitionLink>
                </Button>
              </>
            ) : (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                  <Target className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">Belum ada data skor</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Selesaikan satu simulasi dan jalankan evaluasi untuk melihat
                  aspek yang perlu diperkuat.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <TransitionLink href="/simulasi/baru">Mulai latihan</TransitionLink>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <section id="riwayat" className="mt-8 scroll-mt-20 animate-in-up animate-delay-3 motion-reduce:animate-none">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              Sesi latihan Anda
            </h2>
          </div>
          {sessions.length > 0 && (
            <span className="text-xs text-muted-foreground">{sessions.length} sesi</span>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-white p-8 text-center sm:p-12">
            <div className="pointer-events-none absolute inset-0 grain opacity-30" />
            <div className="relative mx-auto max-w-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-float motion-reduce:animate-none">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-ink">
                Belum ada sesi latihan
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Mulai dengan satu produk dan satu jenis mitra. Dalam beberapa
                menit, Anda akan mendapat skor dan saran perbaikan yang konkret.
              </p>
              <Button asChild size="lg" className="mt-6">
                <TransitionLink href="/simulasi/baru">
                  <CirclePlay className="h-4 w-4" />
                  Mulai simulasi pertama
                </TransitionLink>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-soft">
            {sessions.map((session, index) => {
              const product = session.products;
              const persona = session.buyer_personas;
              const evaluation = evaluationOf(session);
              const partnerMeta = persona ? PARTNER_META[persona.partner_type] : null;
              const PartnerIcon =
                persona?.partner_type === "hotel_resort_bali"
                  ? Hotel
                  : persona?.partner_type === "souvenir_retail"
                    ? Store
                    : Waves;
              const difficultyMeta = persona ? DIFFICULTY_META[persona.difficulty] : null;
              const badge = outcomeBadge(session.outcome);
              const isActive = session.status === "active";
              const href = isActive
                ? `/simulasi/${session.id}`
                : `/simulasi/${session.id}/hasil`;
              const score = evaluation?.rubric_scores.overall ?? null;
              const tone = score !== null ? scoreTone(score) : null;

              return (
                <Link
                  key={session.id}
                  href={href}
                  className={cn(
                    "group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-sand-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-5",
                    index !== sessions.length - 1 && "border-b border-border/60"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary ring-1 ring-border/70">
                      <PartnerIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="max-w-[260px] truncate text-sm font-bold text-ink sm:max-w-[380px]">
                          {product?.name ?? "Produk tidak ditemukan"}
                        </p>
                        {badge && (
                          <Badge variant={badge.variant} className="text-[9px]">
                            {badge.label}
                          </Badge>
                        )}
                        {isActive && (
                          <Badge variant="warning" className="text-[9px]">
                            Berlangsung
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {partnerMeta?.shortLabel ?? "Mitra"}
                        {difficultyMeta ? `, ${difficultyMeta.label}` : ""},{" "}
                        {product ? formatRupiah(product.base_price) : ""},{" "}
                        {formatRelative(session.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-14 sm:pl-0">
                    {score !== null && tone ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-xl font-display text-sm font-bold",
                            tone.bg,
                            tone.color
                          )}
                        >
                          {score}
                        </span>
                        <div className="hidden text-right sm:block">
                          <p className="text-[10px] font-medium text-muted-foreground">Skor</p>
                          <p className={cn("text-[11px] font-semibold", tone.color)}>{tone.label}</p>
                        </div>
                      </div>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-navy">
                        Lanjutkan
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                        Belum dinilai
                      </span>
                    )}

                    <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-white text-muted-foreground transition group-hover:border-primary/30 group-hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

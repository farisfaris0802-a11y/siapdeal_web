import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  Lightbulb,
  MessageSquareQuote,
  Plus,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { DIFFICULTY_META, PARTNER_META, RUBRIC_ASPECTS } from "@/lib/ai/personas";
import { sanitizeAssistantText } from "@/lib/ai/sanitize";
import type {
  ChatMessage,
  Difficulty,
  Evaluation,
  PartnerType,
  SessionOutcome,
  SessionStatus,
} from "@/lib/types";
import { cn, formatDate, formatRupiah, scoreTone } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreRadar } from "@/components/score-radar";
import { ScoreRing } from "@/components/score-ring";

const verdictMeta = {
  siap: {
    label: "Siap menghadapi mitra",
    description: "Pola negosiasi Anda sudah kuat. Pertahankan dan asah detail kecilnya.",
    icon: BadgeCheck,
  },
  cukup: {
    label: "Cukup baik, masih bisa diasah",
    description: "Dasar negosiasi sudah ada. Fokus pada aspek dengan skor terendah.",
    icon: Target,
  },
  perlu_latihan: {
    label: "Perlu latihan lagi",
    description: "Masih ada celah besar. Ulangi skenario dan terapkan saran di bawah.",
    icon: TrendingUp,
  },
} as const;

function outcomeMeta(outcome: SessionOutcome | null) {
  if (outcome === "deal") {
    return { label: "Kesepakatan tercapai", variant: "success" as const, icon: CheckCircle2 };
  }
  if (outcome === "no_deal") {
    return { label: "Tanpa kesepakatan", variant: "destructive" as const, icon: XCircle };
  }
  return { label: "Diakhiri manual", variant: "muted" as const, icon: FileText };
}

export function EvaluationView({
  session,
  evaluation,
  product,
  partnerType,
  difficulty,
  messages,
}: {
  session: {
    id: string;
    created_at: string;
    status: SessionStatus;
    outcome: SessionOutcome | null;
  };
  evaluation: Evaluation;
  product: { name: string; base_price: number; usp: string };
  partnerType: PartnerType;
  difficulty: Difficulty;
  messages: ChatMessage[];
}) {
  const partner = PARTNER_META[partnerType];
  const diff = DIFFICULTY_META[difficulty];
  const scores = evaluation.rubric_scores;
  const verdict = verdictMeta[scores.verdict] ?? verdictMeta.cukup;
  const outcome = outcomeMeta(session.outcome);
  const tone = scoreTone(scores.overall);
  const VerdictIcon = verdict.icon;

  const ranked = [...scores.aspects].sort((a, b) => b.score - a.score);
  const strongest = ranked[0] ?? null;
  const weakest = ranked[ranked.length - 1] ?? null;
  const radarData = scores.aspects.map((aspect) => {
    const meta = RUBRIC_ASPECTS.find((item) => item.key === aspect.key);
    return {
      key: aspect.key,
      label: aspect.label,
      shortLabel: meta?.shortLabel ?? aspect.label,
      score: aspect.score,
    };
  });

  const retryParams = new URLSearchParams({
    nama: product.name,
    harga: String(product.base_price),
    usp: product.usp,
    mitra: partnerType,
    kesulitan: difficulty,
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-white shadow-soft">
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)_270px] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <ScoreRing score={scores.overall} size={152} strokeWidth={11} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5 border-transparent px-2.5 py-1",
                  scores.verdict === "siap"
                    ? "bg-brand-teal/10 text-brand-navy"
                    : scores.verdict === "cukup"
                      ? "bg-brand-teal/10 text-brand-navy"
                      : "bg-rose-50 text-rose-800"
                )}
              >
                <VerdictIcon className="h-3.5 w-3.5" />
                {verdict.label}
              </Badge>
              <span className={cn("text-xs font-semibold", tone.color)}>
                Nilai rata-rata {scores.overall}/100
              </span>
            </div>

            <h2 className="mt-3 text-balance font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
              {scores.summary || verdict.description}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Hasil evaluasi transkrip negosiasi {product.name} dengan{" "}
              {partner.buyerName} ({partner.shortLabel}), level {diff.label.toLowerCase()}.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={outcome.variant} className="gap-1">
                <outcome.icon className="h-3 w-3" />
                {outcome.label}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {partner.shortLabel}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {diff.label}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDate(session.created_at, true)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-sand-50/80 p-4">
            <p className="text-[10px] font-bold text-muted-foreground">
              Ringkasan sesi
            </p>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Produk</span>
                <span className="max-w-[150px] text-right font-semibold leading-snug text-ink">
                  {product.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Harga dasar</span>
                <span className="font-semibold text-ink">{formatRupiah(product.base_price)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Pesan</span>
                <span className="font-semibold text-ink">
                  {messages.filter((message) => message.role === "user").length} dari Anda
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Skor tertinggi</span>
                <span className="font-semibold text-ink">
                  {Math.max(...scores.aspects.map((aspect) => aspect.score))} / 100
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Radar profile */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground">
                Profil negosiasi
              </p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">
                Radar 5 aspek
              </h3>
            </div>
            <Badge variant="outline" className="bg-white text-[10px]">
              Skala 0 sampai 100
            </Badge>
          </div>
          <div className="mt-2">
            <ScoreRadar data={radarData} />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-soft sm:p-6">
          <div className="relative">
            <p className="text-[10px] font-bold text-accent">
              Cara membaca hasil
            </p>
            <h3 className="mt-2 text-balance font-display text-xl font-bold leading-snug">
              {strongest && weakest && strongest.score - weakest.score >= 15
                ? `Kekuatan Anda ada di ${strongest.label.toLowerCase()}, tetapi ${weakest.label.toLowerCase()} masih menahan skor.`
                : "Profil Anda cukup seimbang, sekarang tinggal mempertajam konsistensi."}
            </h3>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {strongest && (
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-brand-mint">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Terkuat
                  </p>
                  <p className="mt-1.5 text-sm font-bold">{strongest.label}</p>
                  <p className="mt-0.5 font-display text-2xl font-bold text-accent">
                    {strongest.score}
                    <span className="ml-1 text-[10px] font-medium text-white/40">/100</span>
                  </p>
                </div>
              )}
              {weakest && (
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-brand-mint">
                    <Target className="h-3.5 w-3.5" />
                    Prioritas latihan
                  </p>
                  <p className="mt-1.5 text-sm font-bold">{weakest.label}</p>
                  <p className="mt-0.5 font-display text-2xl font-bold text-accent">
                    {weakest.score}
                    <span className="ml-1 text-[10px] font-medium text-white/40">/100</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.06] p-3.5 text-[11px] leading-relaxed text-primary-foreground/70">
              <span className="font-semibold text-white">Fokus berikutnya: </span>
              {weakest?.feedback ?? verdict.description}
            </div>
          </div>
        </div>
      </section>

      {/* Aspects */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground">
              Rubrik tetap
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-ink">
              Penilaian per aspek
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">Skala 0 sampai 100</span>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2">
          {scores.aspects.map((aspect, index) => {
            const aspectTone = scoreTone(aspect.score);
            return (
              <div
                key={aspect.key}
                className={cn(
                  "rounded-2xl border border-border/80 bg-white p-5 shadow-soft",
                  index === scores.aspects.length - 1 && scores.aspects.length % 2 === 1
                    ? "md:col-span-2"
                    : ""
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold leading-snug text-ink">{aspect.label}</p>
                      <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground/70">
                        {RUBRIC_ASPECTS.find((item) => item.key === aspect.key)?.labelEn}
                      </p>
                      <p className={cn("mt-0.5 text-[11px] font-semibold", aspectTone.color)}>
                        {aspectTone.label}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold",
                      aspectTone.bg,
                      aspectTone.color
                    )}
                  >
                    {aspect.score}
                  </span>
                </div>

                <Progress
                  value={aspect.score}
                  className="mt-4 h-1.5"
                  indicatorClassName={cn(
                    aspect.score >= 80
                      ? "bg-brand-teal"
                      : aspect.score >= 60
                        ? "bg-brand-navy-soft"
                        : "bg-rose-600"
                  )}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {aspect.feedback}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strengths & weaknesses */}
      <section className="grid gap-3.5 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-teal/25 bg-brand-teal/10 p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-teal/15 text-brand-navy">
              <ThumbsUp className="h-4 w-4" />
            </span>
            <h3 className="font-display text-lg font-bold text-brand-navy">Kekuatan Anda</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {evaluation.strengths.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed text-brand-navy/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-100 text-rose-800">
              <ThumbsDown className="h-4 w-4" />
            </span>
            <h3 className="font-display text-lg font-bold text-rose-950">Yang perlu diperbaiki</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {evaluation.weaknesses.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed text-rose-950/80">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Suggestions */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground">
              Saran perbaikan
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-ink">
              Kalimat yang lebih kuat untuk momen yang sama
            </h3>
          </div>
          <Badge variant="outline" className="hidden shrink-0 gap-1 bg-white sm:inline-flex">
            <Sparkles className="h-3 w-3 text-primary" />
            {evaluation.rephrased_suggestions.length} contoh
          </Badge>
        </div>

        <div className="space-y-3.5">
          {evaluation.rephrased_suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-soft"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-sand-50/70 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-bold text-muted-foreground shadow-sm ring-1 ring-border">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-ink">{suggestion.aspect_label}</span>
                </div>
                <Badge variant="muted" className="text-[10px]">
                  Saran AI
                </Badge>
              </div>

              <div className="grid gap-0 divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700">
                    <Quote className="h-3 w-3" />
                    Respons asli Anda
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    “{suggestion.original}”
                  </p>
                </div>
                <div className="bg-brand-teal/10 p-5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-brand-navy">
                    <Lightbulb className="h-3 w-3" />
                    Versi yang lebih kuat
                  </p>
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-brand-navy">
                    “{suggestion.improved}”
                  </p>
                  <p className="mt-3 border-t border-brand-teal/25 pt-2.5 text-[11px] leading-relaxed text-brand-navy/75">
                    <span className="font-semibold">Mengapa: </span>
                    {suggestion.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transcript */}
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-soft">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-sand-50/60">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <MessageSquareQuote className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Lihat transkrip lengkap</p>
                <p className="text-[11px] text-muted-foreground">
                  {messages.length} pesan, buka untuk meninjau seluruh percakapan
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>

          <div className="max-h-[520px] space-y-3 overflow-y-auto border-t border-border/60 bg-background p-4 sm:p-5">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const content = isUser
                ? message.content
                : sanitizeAssistantText(message.content);
              if (!content) return null;
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser && (
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-teal/15 text-[11px] font-bold text-brand-navy">
                      {partner.buyerName.split(" ").slice(-1)[0]?.charAt(0) ?? "P"}
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[86%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                      isUser
                        ? "rounded-tr-md bg-primary text-primary-foreground"
                        : "rounded-tl-md border border-border/70 bg-white text-ink"
                    )}
                  >
                    {content}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-sand-50 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy" />
        Penilaian ini dihasilkan AI berdasarkan rubrik tetap dan bersifat panduan
        latihan. Hasil negosiasi nyata dapat berbeda tergantung konteks dan
        dinamika hubungan bisnis.
      </div>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lift sm:p-8">
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-[10px] font-bold text-accent">
              Terus berlatih
            </p>
            <h3 className="mt-2 max-w-lg text-balance font-display text-2xl font-bold leading-tight">
              Coba skenario yang sama dengan strategi baru.
            </h3>
            <p className="mt-1.5 text-sm text-primary-foreground/65">
              Bandingkan skor dan lihat perkembangan Anda di dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href={`/simulasi/baru?${retryParams.toString()}`}>
                <RotateCcw className="h-4 w-4" />
                Ulangi skenario
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/simulasi/baru">
                <Plus className="h-4 w-4" />
                Skenario baru
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="flex justify-center pb-2">
        <Button asChild variant="link" className="text-muted-foreground">
          <Link href="/dashboard">
            Kembali ke dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

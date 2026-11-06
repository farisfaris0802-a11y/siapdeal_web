"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, History, Lightbulb, TrendingUp } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_META, PARTNER_META } from "@/lib/ai/personas";
import { useLanguage } from "@/lib/i18n";
import { listLocalSessions, type LocalSession } from "@/lib/local-store";
import { formatDate } from "@/lib/utils";

export function LocalEvaluationList() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<LocalSession[] | null>(null);

  useEffect(() => {
    setSessions(listLocalSessions().filter((session) => session.evaluation));
  }, []);

  const stats = useMemo(() => {
    const evaluated = sessions ?? [];
    const scores = evaluated.map(
      (session) => session.evaluation!.rubric_scores.overall
    );
    return {
      total: evaluated.length,
      average: scores.length
        ? Math.round(
            scores.reduce((total, score) => total + score, 0) / scores.length
          )
        : null,
      best: scores.length ? Math.max(...scores) : null,
    };
  }, [sessions]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      {/* Distinct history hero: gradient instead of the dashboard photo */}
      <header className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,hsl(var(--brand-navy)),hsl(var(--brand-navy-soft))_58%,hsl(var(--brand-teal)))] p-6 text-white shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0 grain opacity-25" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
              <History className="h-3.5 w-3.5" />
              {t("Jejak latihan Anda")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("Riwayat & evaluasi")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              {t(
                "Semua hasil penilaian 5 aspek dalam satu tempat. Data tersimpan di browser ini tanpa akun email."
              )}
            </p>
            <Button
              asChild
              className="mt-5 border border-white/20 bg-cream text-cream-foreground hover:bg-cream/90"
            >
              <Link href="/simulasi/baru?demo=1">
                {t("Mulai simulasi")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2">
            {[
              { label: t("Sesi dinilai"), value: String(stats.total) },
              {
                label: t("Rata-rata skor"),
                value:
                  stats.average !== null
                    ? `${stats.average}/100`
                    : t("Belum ada"),
              },
              {
                label: t("Skor terbaik"),
                value:
                  stats.best !== null ? `${stats.best}/100` : t("Belum ada"),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 backdrop-blur-sm"
              >
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
                  {stat.label}
                </p>
                <p className="mt-1.5 font-display text-xl font-bold leading-none text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {t("Riwayat evaluasi")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("Ulasan skor, verdict, dan ringkasan tiap sesi.")}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("{count} sesi", { count: sessions?.length ?? 0 })}
          </span>
        </div>

        {sessions === null ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("Memuat evaluasi lokal...")}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
              <Lightbulb className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-foreground">
              {t("Belum ada evaluasi")}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t(
                "Selesaikan satu sesi negosiasi, lalu AI akan menilai transkrip dengan rubrik 5 aspek. Hasilnya akan muncul di sini."
              )}
            </p>
            <Button asChild className="mt-5">
              <Link href="/simulasi/baru?demo=1">
                {t("Mulai simulasi pertama")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="relative space-y-3 before:absolute before:bottom-6 before:left-[1.45rem] before:top-6 before:w-px before:bg-border sm:before:left-[1.7rem]">
            {sessions.map((session) => {
              const evaluation = session.evaluation!;
              const partner = PARTNER_META[session.partner_type];
              const diff = DIFFICULTY_META[session.difficulty];
              const score = evaluation.rubric_scores.overall;

              return (
                <Link
                  key={session.id}
                  href={`/simulasi/${session.id}/hasil`}
                  className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 pl-12 transition-colors hover:border-brand-teal/30 hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between sm:pl-14"
                >
                  <span className="absolute left-[0.95rem] top-5 grid h-4 w-4 place-items-center rounded-full border-2 border-card bg-brand-teal shadow-sm sm:left-[1.2rem]">
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </span>

                  <div className="flex min-w-0 items-center gap-4">
                    <ScoreRing score={score} size={68} strokeWidth={7} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="max-w-[260px] truncate text-sm font-bold text-foreground sm:max-w-[420px]">
                          {session.product.name}
                        </p>
                        <Badge
                          variant={
                            evaluation.rubric_scores.verdict === "siap"
                              ? "success"
                              : evaluation.rubric_scores.verdict === "cukup"
                                ? "warning"
                                : "destructive"
                          }
                          className="text-[9px]"
                        >
                          {evaluation.rubric_scores.verdict === "siap"
                            ? t("Siap")
                            : evaluation.rubric_scores.verdict === "cukup"
                              ? t("Cukup")
                              : t("Perlu latihan")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t(partner.shortLabel)}, {t(diff.label)},{" "}
                        {formatDate(session.created_at)}
                      </p>
                      <p className="mt-2 line-clamp-2 max-w-[520px] text-xs leading-relaxed text-muted-foreground">
                        {evaluation.rubric_scores.summary}
                      </p>
                    </div>
                  </div>

                  <span className="flex shrink-0 items-center gap-2 self-end text-sm font-bold text-primary sm:self-auto">
                    <TrendingUp className="h-4 w-4" />
                    {score}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

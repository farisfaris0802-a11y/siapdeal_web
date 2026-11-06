"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_META, PARTNER_META } from "@/lib/ai/personas";
import { listLocalSessions, type LocalSession } from "@/lib/local-store";
import { formatDate } from "@/lib/utils";

export function LocalEvaluationList() {
  const [sessions, setSessions] = useState<LocalSession[] | null>(null);

  useEffect(() => {
    setSessions(listLocalSessions().filter((session) => session.evaluation));
  }, []);

  const stats = useMemo(() => {
    const evaluated = sessions ?? [];
    const scores = evaluated.map((session) => session.evaluation!.rubric_scores.overall);
    return {
      total: evaluated.length,
      average: scores.length
        ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
        : null,
      best: scores.length ? Math.max(...scores) : null,
    };
  }, [sessions]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Evaluasi negosiasi Anda.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Semua hasil penilaian 5 aspek dalam satu tempat. Data tersimpan di
            browser ini tanpa akun email.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/simulasi/baru?demo=1">
            Mulai simulasi
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Sesi dinilai", value: String(stats.total) },
          {
            label: "Rata-rata skor",
            value: stats.average !== null ? `${stats.average}/100` : "Belum ada",
          },
          {
            label: "Skor terbaik",
            value: stats.best !== null ? `${stats.best}/100` : "Belum ada",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 font-display text-2xl font-bold leading-none text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-foreground">Riwayat evaluasi</h2>
          <span className="text-xs text-muted-foreground">
            {sessions?.length ?? 0} sesi
          </span>
        </div>

        {sessions === null ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Memuat evaluasi lokal...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
              <Lightbulb className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-foreground">
              Belum ada evaluasi
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Selesaikan satu sesi negosiasi, lalu AI akan menilai transkrip
              dengan rubrik 5 aspek. Hasilnya akan muncul di sini.
            </p>
            <Button asChild className="mt-5">
              <Link href="/simulasi/baru?demo=1">Mulai simulasi pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const evaluation = session.evaluation!;
              const partner = PARTNER_META[session.partner_type];
              const diff = DIFFICULTY_META[session.difficulty];
              const score = evaluation.rubric_scores.overall;

              return (
                <Link
                  key={session.id}
                  href={`/simulasi/${session.id}/hasil`}
                  className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand-teal/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <ScoreRing score={score} size={76} strokeWidth={7} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="max-w-[280px] truncate text-sm font-bold text-foreground sm:max-w-[420px]">
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
                            ? "Siap"
                            : evaluation.rubric_scores.verdict === "cukup"
                              ? "Cukup"
                              : "Perlu latihan"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {partner.shortLabel}, {diff.label}, {formatDate(session.created_at)}
                      </p>
                      <p className="mt-2 line-clamp-2 max-w-[520px] text-xs leading-relaxed text-muted-foreground">
                        {evaluation.rubric_scores.summary}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 self-end text-sm font-bold text-primary sm:self-auto">
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

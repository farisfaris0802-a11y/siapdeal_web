import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Lightbulb,
} from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { DIFFICULTY_META, PARTNER_META } from "@/lib/ai/personas";
import { getSessionsForUser } from "@/lib/queries";
import type { SessionWithRelations } from "@/lib/types";
import { formatDate, scoreTone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Evaluasi",
};

export const dynamic = "force-dynamic";

function evaluationOf(session: SessionWithRelations) {
  const embedded = session.evaluations;
  if (!embedded) return null;
  const evaluation = Array.isArray(embedded) ? embedded[0] : embedded;
  return evaluation ?? null;
}

export default async function EvaluationIndexPage() {
  const user = await requireUser();
  const sessions = await getSessionsForUser(user.id);

  const evaluated = sessions
    .map((session) => ({ session, evaluation: evaluationOf(session) }))
    .filter(
      (
        item
      ): item is {
        session: SessionWithRelations;
        evaluation: NonNullable<ReturnType<typeof evaluationOf>>;
      } => Boolean(item.evaluation)
    );

  const scores = evaluated.map((item) => item.evaluation.rubric_scores.overall);
  const average = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : null;
  const best = scores.length ? Math.max(...scores) : null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Evaluasi negosiasi Anda.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Semua hasil penilaian 5 aspek dalam satu tempat. Bandingkan skor,
            lihat kekuatan, dan pelajari kalimat yang lebih kuat untuk deal
            berikutnya.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/simulasi/baru">
            Mulai simulasi
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Sesi dinilai", value: String(evaluated.length) },
          {
            label: "Rata-rata skor",
            value: average !== null ? `${average}/100` : "Belum ada",
          },
          {
            label: "Skor terbaik",
            value: best !== null ? `${best}/100` : "Belum ada",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold leading-none text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              Riwayat evaluasi
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {evaluated.length} sesi
          </span>
        </div>

        {evaluated.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-teal/10 text-brand-navy">
              <Lightbulb className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">
              Belum ada evaluasi
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Selesaikan satu sesi negosiasi, lalu AI akan menilai transkrip
              dengan rubrik 5 aspek. Hasilnya akan muncul di sini.
            </p>
            <Button asChild className="mt-5">
              <Link href="/simulasi/baru">Mulai simulasi pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {evaluated.map(({ session, evaluation }) => {
              const product = session.products;
              const persona = session.buyer_personas;
              const partner = persona ? PARTNER_META[persona.partner_type] : null;
              const diff = persona ? DIFFICULTY_META[persona.difficulty] : null;
              const score = evaluation.rubric_scores.overall;
              const tone = scoreTone(score);

              return (
                <Link
                  key={session.id}
                  href={`/simulasi/${session.id}/hasil`}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand-teal/25 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <ScoreRing score={score} size={76} strokeWidth={7} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="max-w-[280px] truncate text-sm font-bold text-ink sm:max-w-[420px]">
                          {product?.name ?? "Produk"}
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
                        {partner?.shortLabel ?? "Mitra"}
                        {diff ? `, ${diff.label}` : ""},{" "}
                        {formatDate(session.created_at)}
                      </p>
                      <p className="mt-2 line-clamp-2 max-w-[520px] text-xs leading-relaxed text-slate-500">
                        {evaluation.rubric_scores.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-[92px] sm:pl-0">
                    <span className={`text-sm font-bold ${tone.color}`}>
                      {score}
                      <span className="text-[10px] font-medium text-slate-400">/100</span>
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors group-hover:border-brand-teal/25 group-hover:text-brand-navy">
                      <ArrowRight className="h-4 w-4" />
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

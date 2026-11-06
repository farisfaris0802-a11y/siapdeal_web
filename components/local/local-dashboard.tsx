"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hotel,
  Plus,
  Store,
  Waves,
} from "lucide-react";

import { DashboardSoundToggle } from "@/components/dashboard/dashboard-effects";
import { LocalDemoLink } from "@/components/auth/local-demo-link";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DIFFICULTY_META, PARTNER_META } from "@/lib/ai/personas";
import { listLocalSessions, type LocalSession } from "@/lib/local-store";
import { formatDate, formatRelative, formatRupiah } from "@/lib/utils";

function partnerIcon(type: LocalSession["partner_type"]) {
  if (type === "hotel_resort_bali") return Hotel;
  if (type === "souvenir_retail") return Store;
  return Waves;
}

export function LocalDashboard() {
  const [sessions, setSessions] = useState<LocalSession[] | null>(null);

  useEffect(() => {
    setSessions(listLocalSessions());
  }, []);

  const stats = useMemo(() => {
    const evaluated = (sessions ?? []).filter((session) => session.evaluation);
    const scores = evaluated.map((session) => session.evaluation!.rubric_scores.overall);
    const average = scores.length
      ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
      : null;
    const best = scores.length ? Math.max(...scores) : null;

    return {
      total: sessions?.length ?? 0,
      evaluated: evaluated.length,
      average,
      best,
    };
  }, [sessions]);

  const active = sessions?.find((session) => session.status === "active") ?? null;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <header className="relative mb-7 overflow-hidden rounded-3xl">
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
              Latih negosiasi tanpa hambatan login. Semua sesi tersimpan di
              browser ini.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DashboardSoundToggle className="border-white/20 bg-white/10 text-cream hover:bg-white/20 hover:text-cream" />
            <Button
              asChild
              variant="outline"
              className="hidden border-white/20 bg-white/10 text-cream hover:bg-white/20 hover:text-cream sm:inline-flex"
            >
              <Link href="/evaluasi">Evaluasi</Link>
            </Button>
            <Button
              asChild
              className="border border-white/20 bg-cream text-cream-foreground hover:bg-cream/90"
            >
              <Link href="/simulator">
                <Plus className="h-4 w-4" />
                Simulasi Baru
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {active && (
        <Link
          href={`/simulasi/${active.id}`}
          className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-brand-teal/25 bg-brand-teal/10 p-4 transition-colors hover:bg-brand-teal/15 sm:flex-row sm:items-center"
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
                {active.product.name},{" "}
                {PARTNER_META[active.partner_type].shortLabel},{" "}
                {formatRelative(active.created_at)}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white">
            Lanjutkan <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total sesi", String(stats.total)],
          ["Sesi dinilai", String(stats.evaluated)],
          ["Rata-rata skor", stats.average !== null ? `${stats.average}/100` : "Belum ada"],
          ["Skor terbaik", stats.best !== null ? `${stats.best}/100` : "Belum ada"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border/80 bg-card p-4">
            <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
            <p className="mt-3 font-display text-3xl font-bold leading-none tracking-tight text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Sesi latihan Anda
          </h2>
          {sessions && sessions.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {sessions.length} sesi
            </span>
          ) : null}
        </div>

        {sessions === null ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Memuat sesi lokal...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SparklesIcon />
            </div>
            <h3 className="mt-5 font-display text-2xl font-bold text-foreground">
              Belum ada sesi latihan
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Mulai dengan satu produk dan satu jenis mitra. Sesi dan skor akan
              tersimpan di browser ini tanpa perlu login.
            </p>
            <Button asChild size="lg" className="mt-6">
              <LocalDemoLink href="/simulator">
                Mulai simulasi pertama
              </LocalDemoLink>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const Icon = partnerIcon(session.partner_type);
              const partner = PARTNER_META[session.partner_type];
              const difficulty = DIFFICULTY_META[session.difficulty];
              const score = session.evaluation?.rubric_scores.overall;
              const href = session.status === "completed"
                ? `/simulasi/${session.id}/hasil`
                : `/simulasi/${session.id}`;

              return (
                <Link
                  key={session.id}
                  href={href}
                  className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand-teal/30 hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {score !== undefined ? (
                      <ScoreRing score={score} size={64} strokeWidth={7} />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="max-w-[280px] truncate text-sm font-bold text-foreground sm:max-w-[420px]">
                          {session.product.name}
                        </p>
                        <Badge
                          variant={
                            session.status === "active"
                              ? "warning"
                              : session.outcome === "deal"
                                ? "success"
                                : "muted"
                          }
                          className="text-[9px]"
                        >
                          {session.status === "active"
                            ? "Berlangsung"
                            : session.outcome === "deal"
                              ? "Sepakat"
                              : "Selesai"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {partner.shortLabel}, {difficulty.label},{" "}
                        {formatRupiah(session.product.base_price)},{" "}
                        {formatRelative(session.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 self-end text-xs font-semibold text-primary sm:self-auto">
                    {session.status === "completed" ? "Lihat evaluasi" : "Lanjutkan"}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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

function SparklesIcon() {
  return <CheckCircle2 className="h-7 w-7" />;
}

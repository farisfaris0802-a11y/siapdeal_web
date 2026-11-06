"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { EvaluationView } from "@/components/simulation/evaluation-view";
import { Badge } from "@/components/ui/badge";
import { getLocalSession, type LocalSession } from "@/lib/local-store";

export function LocalResultPage({ id }: { id: string }) {
  const router = useRouter();
  const [session, setSession] = useState<LocalSession | null | undefined>(undefined);

  useEffect(() => {
    const local = getLocalSession(id);
    setSession(local);
    if (local?.status === "active") {
      router.replace(`/simulasi/${id}`);
    }
  }, [id, router]);

  if (session === undefined) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        Memuat hasil evaluasi...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-foreground">
          Evaluasi tidak ditemukan
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sesi lokal tidak tersedia di browser ini.
        </p>
        <Link
          href="/simulasi/baru?demo=1"
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Mulai sesi baru
        </Link>
      </div>
    );
  }

  if (session.status === "active") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-foreground">
          Sesi masih berlangsung
        </p>
        <Link
          href={`/simulasi/${id}`}
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Kembali ke negosiasi
        </Link>
      </div>
    );
  }

  if (!session.evaluation) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-foreground">
          Evaluasi belum tersedia
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Selesaikan sesi negosiasi untuk mendapatkan skor 5 aspek.
        </p>
        <Link
          href={`/simulasi/${id}`}
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Kembali ke sesi
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1060px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke dashboard
        </Link>
        <Badge variant="outline" className="gap-1 bg-card">
          <CheckCircle2 className="h-3 w-3 text-brand-navy" />
          Sesi selesai
        </Badge>
      </div>

      <EvaluationView
        session={{
          id: session.id,
          created_at: session.created_at,
          status: session.status,
          outcome: session.outcome,
        }}
        evaluation={session.evaluation}
        product={{
          name: session.product.name,
          base_price: session.product.base_price,
          usp: session.product.usp,
        }}
        partnerType={session.partner_type}
        difficulty={session.difficulty}
        messages={session.messages}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { EvaluationTrigger } from "@/components/simulation/evaluation-trigger";
import { EvaluationView } from "@/components/simulation/evaluation-view";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { getEvaluation, getMessages, getSessionDetail } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hasil evaluasi",
};

export const dynamic = "force-dynamic";

export default async function EvaluationResultPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const session = await getSessionDetail(params.id, user.id);

  if (!session) {
    notFound();
  }

  if (session.status === "active") {
    redirect(`/simulasi/${session.id}`);
  }

  if (!session.products || !session.buyer_personas) {
    notFound();
  }

  const [evaluation, messages] = await Promise.all([
    getEvaluation(session.id),
    getMessages(session.id),
  ]);

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
        <Badge variant="outline" className="gap-1 bg-white">
          <CheckCircle2 className="h-3 w-3 text-brand-navy" />
          Sesi selesai
        </Badge>
      </div>

      {evaluation ? (
        <EvaluationView
          session={{
            id: session.id,
            created_at: session.created_at,
            status: session.status,
            outcome: session.outcome,
          }}
          evaluation={evaluation}
          product={{
            name: session.products.name,
            base_price: Number(session.products.base_price),
            usp: session.products.usp,
          }}
          partnerType={session.buyer_personas.partner_type}
          difficulty={session.buyer_personas.difficulty}
          messages={messages}
        />
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <Badge variant="success" className="mb-2">
                  Selesai
                </Badge>
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {session.products.name}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {formatDate(session.created_at, true)}, {messages.length} pesan
                  dalam transkrip
                </p>
              </div>
            </div>
          </div>

          <EvaluationTrigger sessionId={session.id} disabled={messages.length < 2} />

          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              Kembali ke dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

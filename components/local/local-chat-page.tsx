"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { NegotiationChat } from "@/components/simulation/negotiation-chat";
import { getLocalSession, type LocalSession } from "@/lib/local-store";

export function LocalChatPage({ id }: { id: string }) {
  const router = useRouter();
  const [session, setSession] = useState<LocalSession | null | undefined>(undefined);

  useEffect(() => {
    const local = getLocalSession(id);
    setSession(local);

    if (local?.status === "completed") {
      router.replace(`/simulasi/${id}/hasil`);
    }
  }, [id, router]);

  if (session === undefined) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        Memuat ruang negosiasi...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <p className="font-display text-2xl font-semibold text-foreground">
            Sesi tidak ditemukan
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sesi lokal mungkin sudah dihapus dari browser ini.
          </p>
          <button
            type="button"
            onClick={() => router.push("/simulasi/baru?demo=1")}
            className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Mulai sesi baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-background lg:h-screen lg:p-5">
      <NegotiationChat
        sessionId={session.id}
        product={{
          name: session.product.name,
          base_price: session.product.base_price,
          usp: session.product.usp,
          category: session.product.category,
        }}
        partnerType={session.partner_type}
        difficulty={session.difficulty}
        initialMessages={session.messages}
        isJudge
      />
    </div>
  );
}

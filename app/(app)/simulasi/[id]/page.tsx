import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { NegotiationChat } from "@/components/simulation/negotiation-chat";
import { requireUser } from "@/lib/auth";
import { getMessages, getSessionDetail } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Ruang negosiasi",
};

export const dynamic = "force-dynamic";

export default async function SimulationChatPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const session = await getSessionDetail(params.id, user.id);

  if (!session) {
    notFound();
  }

  if (session.status === "completed") {
    redirect(`/simulasi/${session.id}/hasil`);
  }

  if (!session.products || !session.buyer_personas) {
    notFound();
  }

  const messages = await getMessages(session.id);

  return (
    <div className="h-[calc(100dvh-7.5rem)] p-3 sm:p-4 lg:h-screen lg:p-5">
      <NegotiationChat
        sessionId={session.id}
        product={{
          name: session.products.name,
          base_price: Number(session.products.base_price),
          usp: session.products.usp,
          category: session.products.category,
        }}
        partnerType={session.buyer_personas.partner_type}
        difficulty={session.buyer_personas.difficulty}
        initialMessages={messages}
        isJudge={
          Boolean(user.is_anonymous) ||
          user.user_metadata?.role === "judge"
        }
      />
    </div>
  );
}

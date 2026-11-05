import type { Metadata } from "next";

import { LocalChatPage } from "@/components/local/local-chat-page";

export const metadata: Metadata = {
  title: "Ruang negosiasi",
};

export const dynamic = "force-dynamic";

export default function SimulationChatPage({
  params,
}: {
  params: { id: string };
}) {
  return <LocalChatPage id={params.id} />;
}

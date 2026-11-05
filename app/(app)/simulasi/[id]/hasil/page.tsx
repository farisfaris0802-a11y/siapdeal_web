import type { Metadata } from "next";

import { LocalResultPage } from "@/components/local/local-result-page";

export const metadata: Metadata = {
  title: "Hasil evaluasi",
};

export const dynamic = "force-dynamic";

export default function EvaluationResultPage({
  params,
}: {
  params: { id: string };
}) {
  return <LocalResultPage id={params.id} />;
}

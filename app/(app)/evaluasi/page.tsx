import type { Metadata } from "next";

import { LocalEvaluationList } from "@/components/local/local-evaluation-list";

export const metadata: Metadata = {
  title: "Evaluasi",
};

export const dynamic = "force-dynamic";

export default function EvaluationIndexPage() {
  return <LocalEvaluationList />;
}

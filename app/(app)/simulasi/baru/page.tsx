import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { ScenarioForm } from "@/components/simulation/scenario-form";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { SAMPLE_PRODUCTS } from "@/lib/catalog";
import { checkDatabaseHealth } from "@/lib/db-health";

export const metadata: Metadata = {
  title: "Skenario baru",
};

export default async function NewSimulationPage({
  searchParams,
}: {
  searchParams: {
    nama?: string;
    harga?: string;
    usp?: string;
    mitra?: string;
    kesulitan?: string;
    kategori?: string;
    demo?: string;
  };
}) {
  await requireUser();
  const databaseHealth = await checkDatabaseHealth();

  const isDemo = searchParams.demo === "1";
  const sample = SAMPLE_PRODUCTS[0];
  const hasCustomInput = Boolean(
    searchParams.nama || searchParams.harga || searchParams.usp
  );
  const shouldPrefillDemo = isDemo && !hasCustomInput;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <div className="mb-7">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke dashboard
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge variant="outline" className="mb-3 gap-1.5 border-primary/20 bg-white text-primary">
              <Sparkles className="h-3 w-3" />
              {isDemo ? "Mode Demo, Bali DigiFest 2026" : "Skenario baru"}
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Siapkan lawan negosiasi Anda.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Isi data produk, pilih jenis mitra Bali dan tingkat kesulitan. AI
              akan memerankan pembeli dengan karakter, batas harga, dan tuntutan
              komersial yang konsisten.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {["Data produk", "Jenis mitra", "Kesulitan"].map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {index + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
                {index < 2 && <span className="h-px w-4 bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ScenarioForm
        demo={isDemo}
        databaseIssue={
          databaseHealth.ok
            ? null
            : {
                missingTables: databaseHealth.missingTables,
                problems: databaseHealth.problems,
              }
        }
        defaults={{
          name: shouldPrefillDemo ? sample.name : searchParams.nama,
          price: shouldPrefillDemo ? String(sample.basePrice) : searchParams.harga,
          usp: shouldPrefillDemo ? sample.usp : searchParams.usp,
          partner: shouldPrefillDemo ? sample.partner : searchParams.mitra,
          difficulty: shouldPrefillDemo ? sample.difficulty : searchParams.kesulitan,
          category: shouldPrefillDemo ? sample.category : searchParams.kategori,
        }}
      />
    </div>
  );
}

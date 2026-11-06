import type { Metadata } from "next";

import { NewScenarioHero } from "@/components/simulation/new-scenario-hero";
import { ScenarioForm } from "@/components/simulation/scenario-form";
import { SAMPLE_PRODUCTS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Skenario baru",
};

export default function NewSimulationPage({
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
  const isDemo = searchParams.demo === "1";
  const sample = SAMPLE_PRODUCTS[0];
  const hasCustomInput = Boolean(
    searchParams.nama || searchParams.harga || searchParams.usp
  );
  const shouldPrefillDemo = !hasCustomInput;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <NewScenarioHero demo={isDemo} />

      <ScenarioForm
        demo={isDemo}
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

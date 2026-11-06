"use client";

import {
  CheckCircle2,
  Clock,
  Info,
  Lightbulb,
  ShieldCheck,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DIFFICULTY_META,
  PARTNER_META,
  RUBRIC_ASPECTS,
} from "@/lib/ai/personas";
import { CATEGORY_LABEL } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import type { Difficulty, PartnerType, ProductCategory } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

export interface ScenarioPanelProduct {
  name: string;
  base_price: number;
  usp: string;
  category: ProductCategory;
}

export function ScenarioPanel({
  product,
  partnerType,
  difficulty,
}: {
  product: ScenarioPanelProduct;
  partnerType: PartnerType;
  difficulty: Difficulty;
}) {
  const { language, t } = useLanguage();
  const partner = PARTNER_META[partnerType];
  const diff = DIFFICULTY_META[difficulty];

  return (
    <div className="space-y-3">
      <div className="w-full max-w-full overflow-hidden break-words rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t("Detail skenario")}
          </p>
          <Badge variant="success" className="text-[9px]">
            Live
          </Badge>
        </div>
        <p className="mt-2.5 font-display text-lg font-bold leading-snug text-foreground">
          {product.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRupiah(product.base_price)} per unit,{" "}
          {CATEGORY_LABEL[product.category]}
        </p>

        <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-[11px]">
          {[
            [t("Harga dasar"), formatRupiah(product.base_price)],
            [t("Kategori"), t(CATEGORY_LABEL[product.category])],
            [t("Mitra"), t(partner.shortLabel)],
            [t("Tingkat"), t(diff.label)],
            [t("Pembeli"), partner.buyerName],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-muted-foreground">{label}</span>
              <span className="max-w-[150px] break-words text-right font-semibold leading-snug text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-secondary p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <Info className="h-3.5 w-3.5 text-primary" />
            {t("Keunggulan klaim")}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {product.usp}
          </p>
        </div>
      </div>

      <div className="w-full max-w-full overflow-hidden break-words rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {t("Strategi dan tips negosiasi")}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t("Panduan untuk level {level}.", {
                level: t(diff.label).toLowerCase(),
              })}
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
          {difficulty === "easy" ? (
            <>
              <li>{t("Sebutkan harga, isi paket, dan syarat secara spesifik sejak awal.")}</li>
              <li>{t("Hubungkan USP dengan manfaat nyata untuk mitra.")}</li>
              <li>{t("Tutup dengan pertanyaan yang meminta komitmen.")}</li>
            </>
          ) : difficulty === "medium" ? (
            <>
              <li>{t("Jangan langsung menurunkan harga; tanyakan dulu kebutuhan volume.")}</li>
              <li>{t("Tukar konsesi harga dengan syarat pembayaran atau komitmen volume.")}</li>
              <li>{t("Jawab keberatan TOP dengan solusi, bukan penolakan.")}</li>
            </>
          ) : (
            <>
              <li>{t("Jaga batas harga Anda dan jangan panik saat pembeli mengancam mundur.")}</li>
              <li>{t("Tawarkan paket alternatif: harga lebih rendah untuk komitmen lebih besar.")}</li>
              <li>{t("Tolak konsinyasi penuh dengan alternatif yang tetap menguntungkan.")}</li>
            </>
          )}
        </ul>
        <p className="mt-3 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
          {t("Gunakan data, nilai produk, dan trade-off, bukan diskon langsung.")}
        </p>
      </div>

      <div className="w-full max-w-full overflow-hidden break-words rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Target className="h-3.5 w-3.5" />
          {t("Dinilai di akhir sesi")}
        </p>
        <div className="mt-3 space-y-2">
          {RUBRIC_ASPECTS.map((aspect, index) => (
            <div key={aspect.key} className="flex items-start gap-2 text-[11px]">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground">
                {index + 1}
              </span>
              <span className="leading-snug text-muted-foreground">
                {language === "en" ? aspect.labelEn : aspect.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {t("Rubrik tetap dan konsisten antar sesi.")}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-[10px] text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
        {t("Sesi berakhir otomatis saat sepakat atau buntu.")}
      </div>
    </div>
  );
}

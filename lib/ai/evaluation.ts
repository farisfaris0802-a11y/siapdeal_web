import { z } from "zod";

import {
  RUBRIC_ASPECTS,
  RUBRIC_LABEL_BY_KEY,
  getDifficultyMeta,
  getPartnerMeta,
} from "@/lib/ai/personas";
import { CATEGORY_LABEL } from "@/lib/catalog";
import { sanitizeAssistantText } from "@/lib/ai/sanitize";
import type {
  ChatMessage,
  Difficulty,
  Evaluation,
  PartnerType,
  Product,
  RephrasedSuggestion,
  RubricKey,
  RubricScores,
} from "@/lib/types";

const aspectSchema = z.object({
  score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Skor numerik 0-100 untuk aspek ini"),
  feedback: z
    .string()
    .describe(
      "Umpan balik spesifik 2-3 kalimat. Sebutkan perilaku nyata dari transkrip, bukan saran generik."
    ),
});

export const evaluationResponseSchema = z.object({
  aspects: z.object({
    kejelasan_penawaran: aspectSchema,
    value_proposition: aspectSchema,
    handling_objections: aspectSchema,
    fleksibilitas_margin: aspectSchema,
    closing: aspectSchema,
  }),
  summary: z
    .string()
    .describe("Ringkasan performa negosiasi dalam 2-3 kalimat, bahasa Indonesia."),
  strengths: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("2-4 kekuatan spesifik yang ditunjukkan pengguna."),
  weaknesses: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("2-4 kelemahan spesifik yang perlu diperbaiki."),
  rephrased_suggestions: z
    .array(
      z.object({
        aspect: z.enum([
          "kejelasan_penawaran",
          "value_proposition",
          "handling_objections",
          "fleksibilitas_margin",
          "closing",
        ]),
        original: z
          .string()
          .describe("Kutipan atau parafrase dekat dari kalimat lemah pengguna."),
        improved: z
          .string()
          .describe("Versi kalimat yang lebih kuat dan siap dipakai, dalam Bahasa Indonesia."),
        reason: z
          .string()
          .describe("Alasan singkat mengapa versi baru lebih efektif."),
      })
    )
    .min(2)
    .max(4)
    .describe("2-4 contoh perbaikan kalimat dari respons yang lemah."),
});

export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;

/**
 * Dipakai sebagai `experimental_repairText` pada generateObject().
 * Gemini kadang membungkus JSON dengan ```json atau menambahkan preamble.
 */
export function repairJsonText(text: string): string | null {
  let candidate = text.trim();

  candidate = candidate
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  candidate = candidate
    .slice(firstBrace, lastBrace + 1)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

interface EvaluationPromptInput {
  product: Pick<Product, "name" | "base_price" | "usp" | "category">;
  partnerType: PartnerType;
  difficulty: Difficulty;
  messages: Pick<ChatMessage, "role" | "content">[];
  outcome: string | null;
}

export function buildEvaluationPrompt({
  product,
  partnerType,
  difficulty,
  messages,
  outcome,
}: EvaluationPromptInput) {
  const meta = getPartnerMeta(partnerType);
  const diff = getDifficultyMeta(difficulty);

  const transcript = messages
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "PENJUAL (pengguna)"
          : `PEMBELI (${meta.buyerName})`;
      const content =
        message.role === "assistant"
          ? sanitizeAssistantText(message.content)
          : message.content.trim();
      if (!content) return null;
      return `${speaker}: ${content}`;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n\n");

  const outcomeLabel =
    outcome === "deal"
      ? "Kesepakatan tercapai"
      : outcome === "no_deal"
        ? "Negosiasi berakhir tanpa kesepakatan"
        : "Sesi diakhiri manual oleh pengguna";

  return `Anda adalah asesor negosiasi B2B senior yang berpengalaman menilai supplier UMKM untuk ritel dan hospitality Bali. Nilai transkrip simulasi berikut secara adil, objektif, dan spesifik.

## KONTEKS SIMULASI
- Produk yang ditawarkan: ${product.name}
- Kategori produk: ${CATEGORY_LABEL[product.category] ?? "Lainnya"}
- Harga jual dasar: Rp${Number(product.base_price).toLocaleString("id-ID")} per unit
- Klaim keunggulan (USP): ${product.usp}
- Jenis mitra: ${meta.label} (${meta.company}, ${meta.location})
- Tingkat kesulitan: ${diff.label} — ${diff.traits}
- Status akhir: ${outcomeLabel}

## RUBRIK TETAP (5 ASPEK, SKOR 0-100)
1. Kejelasan Penawaran / Offer Clarity (kejelasan_penawaran)
   Menyampaikan harga, isi paket, volume, MOQ, PPN, pengiriman, dan syarat secara spesifik. Skor rendah jika harga tidak jelas, berubah tanpa alasan, atau penawaran kabur.
2. Penyampaian Nilai Produk / Value Proposition (value_proposition)
   Menerjemahkan USP menjadi manfaat bisnis mitra Bali (margin, traffic, kualitas, efisiensi, cerita lokal untuk turis). Skor rendah jika hanya menyebut "produk saya enak/murah" tanpa bukti atau relevansi.
3. Cara Menjawab Keberatan / Objection Handling (handling_objections)
   Menanggapi harga, margin, TOP, titip jual, kualitas, sertifikasi, dan perbandingan supplier dengan tenang dan berbasis alasan. Skor rendah jika menghindar, emosional, atau asal setuju.
4. Fleksibilitas Margin & Batas Toleransi / Margin Flexibility (fleksibilitas_margin)
   Memberi konsesi secara terukur, menukar konsesi dengan volume/termin, dan menjaga batas harga. Skor rendah jika langsung memotong harga besar-besaran atau menolak segala konsesi tanpa alternatif.
5. Ketegasan Menutup Kesepakatan / Closing Assertion (closing)
   Mengarahkan ke kesepakatan konkret (harga final, volume, TOP, konsinyasi, langkah lanjutan). Skor rendah jika percakapan menggantung tanpa ajakan closing.

## PANDUAN SKOR
- 85-100: sangat kuat, taktis, dan berdampak langsung pada kesepakatan.
- 70-84: baik, ada beberapa celah kecil.
- 55-69: cukup, tetapi masih reaktif atau kurang spesifik.
- 40-54: lemah, banyak peluang terlewat.
- 0-39: sangat lemah atau tidak menunjukkan perilaku yang dinilai.
Nilai PERILAKU pengguna, bukan hasil akhir. Sesi tanpa kesepakatan tetap bisa mendapat skor tinggi jika pengguna menjaga margin dan menutup dengan tegas. Sebaliknya, kesepakatan dengan harga yang merugikan harus menurunkan skor fleksibilitas margin.

## TRANSKRIP
${transcript}

## INSTRUKSI OUTPUT
- Berikan skor untuk kelima aspek. Gunakan rentang penuh, jangan memberi semua skor sama.
- Setiap feedback harus merujuk pada isi transkrip (boleh mengutip frasa singkat), bukan saran umum.
- strengths dan weaknesses harus konkret dan berbeda satu sama lain.
- rephrased_suggestions: pilih 2-4 momen respons pengguna yang lemah, tulis ulang menjadi kalimat yang lebih kuat dan natural dalam Bahasa Indonesia. Sertakan alasan singkat.
- Semua teks dalam Bahasa Indonesia. Jangan menilai kepribadian, hanya perilaku negosiasi.
- Jangan menambahkan aspek di luar rubrik.`;
}

export function toRubricScores(response: EvaluationResponse): RubricScores {
  const aspects = RUBRIC_ASPECTS.map((aspect) => {
    const value = response.aspects[aspect.key];
    return {
      key: aspect.key,
      label: aspect.label,
      score: Math.max(0, Math.min(100, Math.round(value.score))),
      feedback: value.feedback.trim(),
    };
  });

  const overall = Math.round(
    aspects.reduce((total, aspect) => total + aspect.score, 0) / aspects.length
  );

  const verdict: RubricScores["verdict"] =
    overall >= 80 ? "siap" : overall >= 60 ? "cukup" : "perlu_latihan";

  return {
    aspects,
    overall,
    verdict,
    summary: response.summary.trim(),
  };
}

export function toRephrasedSuggestions(
  response: EvaluationResponse
): RephrasedSuggestion[] {
  return response.rephrased_suggestions.map((suggestion) => ({
    aspect: suggestion.aspect as RubricKey,
    aspect_label: RUBRIC_LABEL_BY_KEY[suggestion.aspect as RubricKey],
    original: suggestion.original.trim(),
    improved: suggestion.improved.trim(),
    reason: suggestion.reason.trim(),
  }));
}

export type { Evaluation };

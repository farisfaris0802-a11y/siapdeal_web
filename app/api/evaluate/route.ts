import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";

import { getEvaluationConfig, isAIConfigured } from "@/lib/ai/model";
import {
  buildEvaluationPrompt,
  evaluationResponseSchema,
  repairJsonText,
  toRephrasedSuggestions,
  toRubricScores,
  type EvaluationResponse,
} from "@/lib/ai/evaluation";

export const maxDuration = 60;

const bodySchema = z.object({
  sessionId: z.string().min(1),
  outcome: z.enum(["deal", "no_deal", "manual"]).optional(),
  partnerType: z.enum(["hotel_resort_bali", "souvenir_retail", "beach_club_cafe"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.enum(["id", "en"]).optional(),
  product: z.object({
    name: z.string().trim().min(1).max(200),
    base_price: z.number().positive(),
    usp: z.string().trim().min(1).max(2000),
    category: z.enum([
      "kopi_minuman",
      "makanan_olahan",
      "spa_wellness",
      "fashion_kriya",
      "lainnya",
    ]),
  }),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(2),
});

export async function POST(request: Request) {
  try {
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "API key AI belum diatur. Tambahkan GOOGLE_GENERATIVE_AI_API_KEY atau OPENAI_API_KEY di environment Vercel.",
        },
        { status: 503 }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Permintaan evaluasi tidak valid." },
        { status: 400 }
      );
    }

    const {
      sessionId,
      outcome,
      product,
      partnerType,
      difficulty,
      language,
      messages,
    } = parsed.data;

    if (!messages.some((message) => message.role === "user")) {
      return NextResponse.json(
        {
          error:
            "Belum ada percakapan yang cukup untuk dinilai. Kirim minimal satu pesan negosiasi terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    const evaluationConfig = getEvaluationConfig();
    const prompt = buildEvaluationPrompt({
      product,
      partnerType,
      difficulty,
      language,
      messages,
      outcome: outcome ?? "manual",
    });
    const languageName =
      language === "en" ? "English" : "Bahasa Indonesia";

    const baseOptions = {
      schema: evaluationResponseSchema,
      system: `Anda asesor negosiasi B2B yang ketat, adil, dan konstruktif. Nilai berdasarkan bukti dari transkrip dan rubrik. Keluarkan HANYA JSON valid sesuai schema, tanpa markdown code fence, tanpa preamble, dan seluruh teks dalam ${languageName}.`,
      prompt,
      temperature: 0.2,
      maxTokens: 4000,
      maxRetries: 1,
      mode: "json" as const,
      experimental_repairText: async ({ text }: { text: string }) =>
        repairJsonText(text),
    };

    let object: EvaluationResponse;

    try {
      const primary = await generateObject({
        ...baseOptions,
        model: evaluationConfig.model,
        providerOptions:
          evaluationConfig.provider === "google" &&
          evaluationConfig.supportsThinkingConfig
            ? {
                google: {
                  thinkingConfig: {
                    thinkingBudget: 0,
                    includeThoughts: false,
                  },
                },
              }
            : undefined,
      });
      object = primary.object;
    } catch (primaryError) {
      if (!evaluationConfig.fallbackModel) throw primaryError;

      const fallback = await generateObject({
        ...baseOptions,
        model: evaluationConfig.fallbackModel,
      });
      object = fallback.object;
    }

    const evaluation = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      rubric_scores: toRubricScores(object, language),
      strengths: object.strengths.map((item) => item.trim()),
      weaknesses: object.weaknesses.map((item) => item.trim()),
      rephrased_suggestions: toRephrasedSuggestions(object, language),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("[evaluate] failed", error);
    const rawMessage = error instanceof Error ? error.message : "";
    const busy = /high demand|overloaded|unavailable|503|429/i.test(rawMessage);
    return NextResponse.json(
      {
        error: busy
          ? "Model AI sedang sibuk. Silakan coba lagi dalam beberapa saat."
          : "Evaluasi AI gagal menghasilkan penilaian yang valid. Silakan coba lagi.",
      },
      { status: 502 }
    );
  }
}

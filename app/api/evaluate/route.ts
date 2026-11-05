import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";
import { getEvaluationConfig, isAIConfigured } from "@/lib/ai/model";
import {
  buildEvaluationPrompt,
  evaluationResponseSchema,
  repairJsonText,
  toRephrasedSuggestions,
  toRubricScores,
  type EvaluationResponse,
} from "@/lib/ai/evaluation";
import type {
  BuyerPersona,
  ChatMessage,
  Evaluation,
  Product,
  SessionOutcome,
  SimulationSession,
} from "@/lib/types";

export const maxDuration = 60;

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  outcome: z.enum(["deal", "no_deal", "manual"]).optional(),
});

type SessionRow = SimulationSession & {
  products: Pick<
    Product,
    "id" | "name" | "base_price" | "usp" | "category"
  > | null;
  buyer_personas: Pick<
    BuyerPersona,
    "id" | "partner_type" | "difficulty" | "min_acceptable_price"
  > | null;
};

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: SUPABASE_SETUP_MESSAGE }, { status: 503 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "API key AI belum diatur. Tambahkan GOOGLE_GENERATIVE_AI_API_KEY atau OPENAI_API_KEY di .env.local.",
        },
        { status: 503 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi login tidak ditemukan. Silakan masuk kembali." },
        { status: 401 }
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

    const { sessionId } = parsed.data;

    const { data: sessionData, error: sessionError } = await supabase
      .from("simulation_sessions")
      .select(
        "*, products(id, name, base_price, usp, category), buyer_personas(id, partner_type, difficulty, min_acceptable_price)"
      )
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError) {
      console.error("[evaluate] session fetch", sessionError);
      return NextResponse.json(
        { error: "Gagal memuat sesi simulasi." },
        { status: 500 }
      );
    }

    if (!sessionData) {
      return NextResponse.json(
        { error: "Sesi simulasi tidak ditemukan." },
        { status: 404 }
      );
    }

    // Evaluasi bersifat idempotent: jika sudah ada, kembalikan yang lama.
    const { data: existing } = await supabase
      .from("evaluations")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ evaluation: existing as Evaluation });
    }

    const session = sessionData as unknown as SessionRow;

    if (!session.products || !session.buyer_personas) {
      return NextResponse.json(
        { error: "Data produk atau profil pembeli tidak lengkap." },
        { status: 422 }
      );
    }

    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("[evaluate] messages fetch", messagesError);
      return NextResponse.json(
        { error: "Gagal memuat transkrip percakapan." },
        { status: 500 }
      );
    }

    const messages = (messagesData ?? []) as Pick<ChatMessage, "role" | "content">[];

    if (messages.length < 2 || !messages.some((message) => message.role === "user")) {
      return NextResponse.json(
        {
          error:
            "Belum ada percakapan yang cukup untuk dinilai. Kirim minimal satu pesan negosiasi terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    const outcome: SessionOutcome =
      parsed.data.outcome ?? session.outcome ?? "manual";

    const evaluationConfig = getEvaluationConfig();
    const evaluationPrompt = buildEvaluationPrompt({
      product: session.products,
      partnerType: session.buyer_personas.partner_type,
      difficulty: session.buyer_personas.difficulty,
      messages,
      outcome,
    });

    const baseOptions = {
      schema: evaluationResponseSchema,
      system:
        "Anda asesor negosiasi B2B yang ketat, adil, dan konstruktif. Nilai berdasarkan bukti dari transkrip dan rubrik. Keluarkan HANYA JSON valid sesuai schema, tanpa markdown code fence, tanpa preamble, dan seluruh teks dalam Bahasa Indonesia.",
      prompt: evaluationPrompt,
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
      const err = primaryError as Error & { text?: string };
      console.error("[evaluate] primary model failed", {
        name: err.name,
        message: err.message,
        rawText: err.text?.slice(0, 500),
      });

      if (!evaluationConfig.fallbackModel) {
        throw primaryError;
      }

      console.warn(
        `[evaluate] retrying with fallback model ${evaluationConfig.fallbackLabel}`
      );

      const fallback = await generateObject({
        ...baseOptions,
        model: evaluationConfig.fallbackModel,
        // Flash Lite tidak menerima thinkingConfig; jangan kirim providerOptions.
      });
      object = fallback.object;
    }

    const rubricScores = toRubricScores(object);
    const suggestions = toRephrasedSuggestions(object);

    const { data: inserted, error: insertError } = await supabase
      .from("evaluations")
      .insert({
        session_id: sessionId,
        rubric_scores: rubricScores,
        strengths: object.strengths.map((item) => item.trim()),
        weaknesses: object.weaknesses.map((item) => item.trim()),
        rephrased_suggestions: suggestions,
      })
      .select()
      .single();

    if (insertError) {
      // Bisa terjadi race condition (dua request evaluasi bersamaan).
      const { data: raced } = await supabase
        .from("evaluations")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (raced) {
        return NextResponse.json({ evaluation: raced as Evaluation });
      }

      console.error("[evaluate] insert", insertError);
      return NextResponse.json(
        { error: "Evaluasi gagal disimpan. Silakan coba lagi." },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("simulation_sessions")
      .update({
        status: "completed",
        outcome,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[evaluate] update session", updateError);
    }

    return NextResponse.json({ evaluation: inserted as Evaluation });
  } catch (error) {
    console.error("[evaluate] unexpected", error);

    const rawMessage = error instanceof Error ? error.message : "";
    const busy =
      /high demand|overloaded|unavailable|503|429/i.test(rawMessage);

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

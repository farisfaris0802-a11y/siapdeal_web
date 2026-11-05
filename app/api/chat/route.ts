import { NextResponse } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";
import { getAIConfig, isAIConfigured } from "@/lib/ai/model";
import {
  buildBuyerSystemPrompt,
} from "@/lib/ai/buyer-prompt";
import { sanitizeAssistantText } from "@/lib/ai/sanitize";
import { createCleanTextTransform } from "@/lib/ai/stream-cleaner";
import type {
  BuyerPersona,
  ChatMessage,
  Product,
  SimulationSession,
} from "@/lib/types";

export const maxDuration = 60;

// Beri ruang cukup untuk menyelesaikan kalimat. Nilai lama 500 terlalu
// kecil, terutama jika provider menghitung token "thinking" ke output.
const MAX_OUTPUT_TOKENS = 1000;

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(1)
    .max(60),
});

type SessionRow = SimulationSession & {
  products: Pick<
    Product,
    "id" | "name" | "base_price" | "usp" | "category"
  > | null;
  buyer_personas: Pick<
    BuyerPersona,
    "id" | "partner_type" | "difficulty" | "system_prompt" | "min_acceptable_price"
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
        { error: "Format pesan tidak valid." },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;
    const messages = parsed.data.messages;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Pesan terakhir harus berasal dari pengguna." },
        { status: 400 }
      );
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("simulation_sessions")
      .select(
        "*, products(id, name, base_price, usp, category), buyer_personas(id, partner_type, difficulty, system_prompt, min_acceptable_price)"
      )
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError) {
      console.error("[chat] session fetch", sessionError);
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

    const session = sessionData as unknown as SessionRow;

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Sesi ini sudah selesai. Buka halaman hasil evaluasi." },
        { status: 409 }
      );
    }

    if (!session.products || !session.buyer_personas) {
      return NextResponse.json(
        { error: "Data produk atau profil pembeli tidak lengkap." },
        { status: 422 }
      );
    }

    // Simpan pesan pengguna. Hindari duplikasi jika request diulang.
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = recentMessages?.[0] as Pick<ChatMessage, "role" | "content"> | undefined;

    if (
      !latest ||
      latest.role !== "user" ||
      latest.content.trim() !== lastMessage.content.trim()
    ) {
      const { error: insertUserError } = await supabase.from("messages").insert({
        session_id: sessionId,
        role: "user",
        content: lastMessage.content.trim(),
      });

      if (insertUserError) {
        console.error("[chat] insert user message", insertUserError);
      }
    }

    const system = buildBuyerSystemPrompt({
      product: session.products,
      partnerType: session.buyer_personas.partner_type,
      difficulty: session.buyer_personas.difficulty,
      minAcceptablePrice: session.buyer_personas.min_acceptable_price,
      personaPrompt: session.buyer_personas.system_prompt,
    });

    const coreMessages: CoreMessage[] = messages
      .slice(-40)
      .map((message) => ({
        role: message.role,
        content:
          message.role === "assistant"
            ? sanitizeAssistantText(message.content)
            : message.content,
      }))
      .filter((message) => message.content.length > 0);

    const { model, provider, supportsThinkingConfig } = getAIConfig();

    const result = streamText({
      model,
      // System instruction dikirim terpisah, TIDAK dimasukkan ke array messages.
      system,
      messages: coreMessages,
      temperature: 0.8,
      maxTokens: MAX_OUTPUT_TOKENS,
      // Sengaja TIDAK mengatur stopSequences. Jangan menambahkan stop token
      // yang bisa memotong angka, harga, atau tanda baca di tengah kalimat.
      maxRetries: 1,
      // Gemini Flash mendukung thinkingConfig; Flash Lite tidak.
      providerOptions:
        provider === "google" && supportsThinkingConfig
          ? {
              google: {
                thinkingConfig: { thinkingBudget: 0, includeThoughts: false },
              },
            }
          : undefined,
      // Bersihkan <think>, reasoning internal, dan kalimat analisis SEBELUM
      // teks dikirim ke frontend. Token [[DEAL]] tetap dipertahankan untuk
      // deteksi akhir sesi di client.
      experimental_transform: createCleanTextTransform(),
      onFinish: async ({ text, finishReason }) => {
        if (finishReason === "length") {
          console.warn("[chat] output truncated by MAX_OUTPUT_TOKENS", {
            maxTokens: MAX_OUTPUT_TOKENS,
          });
        }

        const clean = sanitizeAssistantText(text);
        if (!clean) return;

        if (clean !== text.trim()) {
          console.info("[chat] sanitized internal reasoning", {
            removedChars: Math.max(0, text.length - clean.length),
          });
        }

        const { error } = await supabase.from("messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: clean,
        });

        if (error) {
          console.error("[chat] insert assistant message", error);
        }
      },
      onError: ({ error }) => {
        console.error("[chat] stream error", error);
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) =>
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghubungi AI.",
    });
  } catch (error) {
    console.error("[chat] unexpected", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan tak terduga pada server." },
      { status: 500 }
    );
  }
}

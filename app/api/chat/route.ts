import { NextResponse } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { z } from "zod";

import { getAIConfig, isAIConfigured } from "@/lib/ai/model";
import { buildBuyerSystemPrompt } from "@/lib/ai/buyer-prompt";
import { DIFFICULTY_META } from "@/lib/ai/personas";
import { sanitizeAssistantText } from "@/lib/ai/sanitize";
import { createCleanTextTransform } from "@/lib/ai/stream-cleaner";

export const maxDuration = 60;

const MAX_OUTPUT_TOKENS = 1000;

const bodySchema = z.object({
  partnerType: z.enum(["hotel_resort_bali", "souvenir_retail", "beach_club_cafe"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
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
    .min(1)
    .max(60),
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
        { error: "Format sesi negosiasi tidak valid." },
        { status: 400 }
      );
    }

    const { messages, product, partnerType, difficulty } = parsed.data;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Pesan terakhir harus berasal dari pengguna." },
        { status: 400 }
      );
    }

    const system = buildBuyerSystemPrompt({
      product,
      partnerType,
      difficulty,
      minAcceptablePrice: DIFFICULTY_META[difficulty].ceilingRatio,
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
      system,
      messages: coreMessages,
      temperature: 0.8,
      maxTokens: MAX_OUTPUT_TOKENS,
      maxRetries: 1,
      providerOptions:
        provider === "google" && supportsThinkingConfig
          ? {
              google: {
                thinkingConfig: { thinkingBudget: 0, includeThoughts: false },
              },
            }
          : undefined,
      experimental_transform: createCleanTextTransform(),
      onFinish: ({ finishReason }) => {
        if (finishReason === "length") {
          console.warn("[chat] output truncated by MAX_OUTPUT_TOKENS");
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

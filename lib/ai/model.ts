import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export function isAIConfigured() {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY
  );
}

export function getAIConfig() {
  const googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (googleKey) {
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const modelId = process.env.AI_MODEL || "gemini-3.5-flash";
    return {
      provider: "google" as const,
      model: google(modelId),
      label: modelId,
      supportsThinkingConfig: !modelId.includes("lite"),
    };
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const modelId = process.env.AI_MODEL || "gpt-4o-mini";
    return {
      provider: "openai" as const,
      model: openai(modelId),
      label: modelId,
      supportsThinkingConfig: false,
    };
  }

  throw new Error(
    "API key AI belum diatur. Isi GOOGLE_GENERATIVE_AI_API_KEY atau OPENAI_API_KEY di .env.local."
  );
}

/**
 * Konfigurasi khusus evaluasi:
 * - primary  : Gemini Flash (kualitas penalaran lebih baik)
 * - fallback : Gemini Flash Lite (lebih tersedia saat model utama sibuk)
 *
 * Fallback hanya dipakai jika primary gagal (503/parse error).
 */
export function getEvaluationConfig() {
  const googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (googleKey) {
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const primaryId =
      process.env.AI_EVAL_MODEL ||
      process.env.AI_MODEL ||
      "gemini-3.5-flash";
    const fallbackId =
      process.env.AI_EVAL_FALLBACK_MODEL || "gemini-3.5-flash-lite";

    return {
      provider: "google" as const,
      model: google(primaryId),
      label: primaryId,
      fallbackModel: google(fallbackId),
      fallbackLabel: fallbackId,
      supportsThinkingConfig: !primaryId.includes("lite"),
    };
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const modelId = process.env.AI_EVAL_MODEL || "gpt-4o-mini";
    return {
      provider: "openai" as const,
      model: openai(modelId),
      label: modelId,
      fallbackModel: null,
      fallbackLabel: null,
      supportsThinkingConfig: false,
    };
  }

  throw new Error(
    "API key AI belum diatur. Isi GOOGLE_GENERATIVE_AI_API_KEY atau OPENAI_API_KEY di .env.local."
  );
}


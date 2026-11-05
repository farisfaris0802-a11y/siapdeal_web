const PRIMARY_MODEL = "gemini-3.5-transcribe";
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];
const PROMPT =
  "Transkripsikan audio ini secara verbatim dalam Bahasa Indonesia (id-ID), menggunakan aksara Latin. Audio ini berisi percakapan bisnis berbahasa Indonesia, kemungkinan dengan campuran istilah Inggris. Jangan menerjemahkan ke bahasa Hindi, India, atau bahasa lain selain Indonesia. Jangan memakai aksara Devanagari. Kembalikan hanya teks transkrip, tanpa penjelasan, tanpa tanda kutip, dan tanpa label.";

type TranscriptionResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        audioTranscription?: { text?: string };
      }>;
    };
  }>;
  error?: { message?: string; status?: string };
};

async function requestTranscription(
  model: string,
  key: string,
  base64Audio: string,
  mimeType: string
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Audio,
                },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | TranscriptionResponse
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || `Transcription request failed (${response.status}).`
    );
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? part.audioTranscription?.text ?? "")
    .join("")
    .trim();

  if (!text) {
    console.warn("[transcribe] no transcript", {
      model,
      mimeType,
      bytes: base64Audio.length,
    });
    throw new Error("Tidak ada transkrip yang dihasilkan.");
  }

  return text;
}

function needsIndonesian(text: string) {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasLatin = /[A-Za-z]/.test(text);
  const hindiWords =
    text.match(
      /\b(aap|kaise|kya|nahi|mujhe|tum|bhai|accha|bahut|karo|karna|mera|tera|hamara|samajh)\b/gi
    )?.length ?? 0;

  return hasDevanagari || !hasLatin || hindiWords >= 2;
}

async function translateToIndonesian(text: string, key: string) {
  const prompt = `Terjemahkan transkrip berikut ke Bahasa Indonesia yang natural, dengan aksara Latin. Pertahankan nama, angka, dan istilah bisnis. Kembalikan hanya terjemahan tanpa penjelasan.\n\n${text}`;

  for (const model of ["gemini-3.1-flash-lite", "gemini-3.6-flash"]) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          signal: AbortSignal.timeout(15_000),
        }
      );

      const payload = (await response.json().catch(() => null)) as
        | TranscriptionResponse
        | null;

      if (!response.ok) continue;

      const translated = payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? part.audioTranscription?.text ?? "")
        .join("")
        .trim();

      if (translated) return translated;
    } catch {
      // Coba model terjemahan berikutnya.
    }
  }

  return null;
}

export async function transcribeAudio({
  bytes,
  mimeType,
}: {
  bytes: Buffer;
  mimeType: string;
}) {
  const key =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("API key Google AI belum diatur.");
  }

  const base64Audio = bytes.toString("base64");
  const configuredModel = process.env.AI_TRANSCRIBE_MODEL;
  const models = [
    ...(configuredModel ? [configuredModel] : []),
    PRIMARY_MODEL,
    ...FALLBACK_MODELS,
  ].filter((model, index, all) => all.indexOf(model) === index);

  let lastError: unknown = null;

  for (const model of models) {
    try {
      const text = await requestTranscription(model, key, base64Audio, mimeType);

      if (!needsIndonesian(text)) return text;

      const translated = await translateToIndonesian(text, key);
      if (translated) return translated;

      throw new Error("Transkrip terdeteksi bukan Bahasa Indonesia.");
    } catch (error) {
      lastError = error;
      console.warn("[transcribe] model failed", {
        model,
        message: error instanceof Error ? error.message : error,
      });
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gagal memproses transkripsi suara.");
}

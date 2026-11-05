import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isAIConfigured } from "@/lib/ai/model";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";

export const maxDuration = 60;

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: SUPABASE_SETUP_MESSAGE }, { status: 503 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "API key AI belum diatur." },
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

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || typeof audio === "string") {
      return NextResponse.json(
        { error: "File suara tidak ditemukan." },
        { status: 400 }
      );
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Rekaman terlalu besar. Coba rekam lebih singkat." },
        { status: 413 }
      );
    }

    const bytes = Buffer.from(await audio.arrayBuffer());
    if (bytes.length < 1024) {
      return NextResponse.json(
        { error: "Rekaman terlalu pendek. Coba bicara lebih jelas." },
        { status: 422 }
      );
    }

    const text = await transcribeAudio({
      bytes,
      mimeType: audio.type || "audio/wav",
    });

    const cleanedText = text
      .trim()
      .replace(/^["“”]+|["“”]+$/g, "")
      .trim();

    if (!cleanedText) {
      return NextResponse.json(
        {
          error:
            "Tidak ada suara yang bisa dikenali. Coba bicara lebih dekat ke mikrofon.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: cleanedText });
  } catch (error) {
    console.error("[transcribe] failed", error);
    return NextResponse.json(
      { error: "Gagal memproses suara. Coba lagi." },
      { status: 502 }
    );
  }
}

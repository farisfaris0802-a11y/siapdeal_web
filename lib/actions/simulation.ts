"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { describeDatabaseError } from "@/lib/supabase/errors";
import {
  getPartnerMeta,
  OPENING_MESSAGE_TEMPLATES,
  PARTNER_TYPES,
} from "@/lib/ai/personas";
import { PRODUCT_CATEGORIES } from "@/lib/catalog";
import type {
  BuyerPersona,
  Difficulty,
  PartnerType,
  Product,
  ProductCategory,
  SimulationSession,
} from "@/lib/types";

type StartState = {
  error: string | null;
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const CATEGORIES = PRODUCT_CATEGORIES.map((category) => category.value);

export async function createSimulationAction(
  _prevState: StartState,
  formData: FormData
): Promise<StartState> {
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("base_price") ?? "").replace(/[^\d]/g, "");
  const usp = String(formData.get("usp") ?? "").trim();
  const partnerType = String(formData.get("partner_type") ?? "") as PartnerType;
  const difficulty = String(formData.get("difficulty") ?? "") as Difficulty;
  const categoryInput = String(formData.get("category") ?? "lainnya") as ProductCategory;
  const category = CATEGORIES.includes(categoryInput) ? categoryInput : "lainnya";

  if (name.length < 2 || name.length > 120) {
    return { error: "Nama produk harus 2–120 karakter." };
  }

  const basePrice = Number(priceRaw);
  if (!Number.isFinite(basePrice) || basePrice <= 0 || basePrice > 1_000_000_000_000) {
    return { error: "Harga jual dasar harus berupa angka lebih dari 0." };
  }

  if (usp.length < 10) {
    return { error: "Ceritakan keunggulan produk minimal 10 karakter agar AI bisa menilai nilai jualnya." };
  }

  if (usp.length > 1200) {
    return { error: "Keunggulan produk maksimal 1200 karakter." };
  }

  if (!PARTNER_TYPES.includes(partnerType)) {
    return { error: "Pilih jenis mitra yang tersedia." };
  }

  if (!DIFFICULTIES.includes(difficulty)) {
    return { error: "Pilih tingkat kesulitan yang tersedia." };
  }

  if (!CATEGORIES.includes(category)) {
    return { error: "Pilih kategori produk yang tersedia." };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi login berakhir. Silakan masuk kembali." };
    }

    const { data: persona, error: personaError } = await supabase
      .from("buyer_personas")
      .select("*")
      .eq("partner_type", partnerType)
      .eq("difficulty", difficulty)
      .maybeSingle();

    if (personaError) {
      console.error("[simulation] persona", personaError);
      return {
        error: describeDatabaseError(
          personaError,
          "buyer_personas",
          "Memuat profil pembeli virtual"
        ),
      };
    }

    if (!persona) {
      return {
        error:
          "Profil pembeli untuk kombinasi mitra dan level ini belum tersedia. Jalankan seed supabase/migrations/20260101000001_seed_buyer_personas.sql, lalu refresh halaman.",
      };
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        name,
        base_price: basePrice,
        usp,
        category,
      })
      .select()
      .single();

    if (productError) {
      console.error("[simulation] product", productError);
      return {
        error: describeDatabaseError(
          productError,
          "products",
          "Menyimpan data produk"
        ),
      };
    }

    if (!product) {
      return { error: "Gagal menyimpan data produk. Silakan coba lagi." };
    }

    const { data: session, error: sessionError } = await supabase
      .from("simulation_sessions")
      .insert({
        user_id: user.id,
        product_id: (product as Product).id,
        buyer_persona_id: (persona as BuyerPersona).id,
        status: "active",
      })
      .select()
      .single();

    if (sessionError) {
      console.error("[simulation] session", sessionError);
      return {
        error: describeDatabaseError(
          sessionError,
          "simulation_sessions",
          "Membuat sesi simulasi"
        ),
      };
    }

    if (!session) {
      return { error: "Gagal membuat sesi simulasi. Silakan coba lagi." };
    }

    const meta = getPartnerMeta(partnerType);
    const template = OPENING_MESSAGE_TEMPLATES[partnerType];

    const greeting = template
      .replaceAll("{buyer}", meta.buyerName)
      .replaceAll("{company}", meta.company)
      .replaceAll("{product}", name);

    const { error: greetingError } = await supabase.from("messages").insert({
      session_id: (session as SimulationSession).id,
      role: "assistant",
      content: greeting,
    });

    if (greetingError) {
      console.error("[simulation] greeting", greetingError);

      // Jangan tinggalkan sesi tanpa pesan pembuka. Hapus sesi + produk
      // agar pengguna bisa mencoba lagi tanpa data yatim.
      await supabase
        .from("simulation_sessions")
        .delete()
        .eq("id", (session as SimulationSession).id);
      await supabase
        .from("products")
        .delete()
        .eq("id", (product as Product).id);

      return {
        error: describeDatabaseError(
          greetingError,
          "messages",
          "Menyimpan pesan pembuka"
        ),
      };
    }

    // Simpan preferensi tingkat kesulitan pada metadata pesan pembuka tidak
    // diperlukan; persona sudah terhubung melalui buyer_persona_id.

    redirect(`/simulasi/${(session as SimulationSession).id}`);
  } catch (error) {
    // redirect() melempar NEXT_REDIRECT — teruskan agar navigasi berjalan.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("[simulation] unexpected", error);
    return {
      error: "Terjadi kesalahan saat membuat simulasi. Silakan coba lagi.",
    };
  }

  return { error: null };
}

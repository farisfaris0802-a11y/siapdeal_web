export type PartnerType =
  | "hotel_resort_bali"
  | "souvenir_retail"
  | "beach_club_cafe";

export type Difficulty = "easy" | "medium" | "hard";
export type SessionStatus = "active" | "completed";
export type SessionOutcome = "deal" | "no_deal" | "manual";
export type ChatRole = "user" | "assistant";

export type ProductCategory =
  | "kopi_minuman"
  | "makanan_olahan"
  | "spa_wellness"
  | "fashion_kriya"
  | "lainnya";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  base_price: number;
  usp: string;
  category: ProductCategory;
  created_at: string;
}

export interface BuyerPersona {
  id: string;
  partner_type: PartnerType;
  difficulty: Difficulty;
  system_prompt: string;
  /**
   * Rasio harga maksimum pembeli terhadap harga dasar produk (0–1).
   * Nilai > 1 tetap didukung sebagai harga absolut untuk kompatibilitas data lama.
   */
  min_acceptable_price: number;
}

export interface SimulationSession {
  id: string;
  user_id: string;
  product_id: string;
  buyer_persona_id: string;
  status: SessionStatus;
  outcome: SessionOutcome | null;
  created_at: string;
  ended_at: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export type RubricKey =
  | "kejelasan_penawaran"
  | "value_proposition"
  | "handling_objections"
  | "fleksibilitas_margin"
  | "closing";

export interface RubricAspectScore {
  key: RubricKey;
  label: string;
  score: number;
  feedback: string;
}

export type EvaluationVerdict = "siap" | "cukup" | "perlu_latihan";

export interface RubricScores {
  aspects: RubricAspectScore[];
  overall: number;
  verdict: EvaluationVerdict;
  summary: string;
}

export interface RephrasedSuggestion {
  aspect: RubricKey;
  aspect_label: string;
  original: string;
  improved: string;
  reason: string;
}

export interface Evaluation {
  id: string;
  session_id: string;
  rubric_scores: RubricScores;
  strengths: string[];
  weaknesses: string[];
  rephrased_suggestions: RephrasedSuggestion[];
  created_at: string;
}

export interface SessionWithRelations extends SimulationSession {
  products: Pick<
    Product,
    "id" | "name" | "base_price" | "usp" | "category"
  > | null;
  buyer_personas: Pick<
    BuyerPersona,
    "id" | "partner_type" | "difficulty" | "system_prompt" | "min_acceptable_price"
  > | null;
  evaluations?:
    | Pick<Evaluation, "id" | "rubric_scores" | "created_at">[]
    | Pick<Evaluation, "id" | "rubric_scores" | "created_at">
    | null;
}

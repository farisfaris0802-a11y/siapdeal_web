import { createClient } from "@/lib/supabase/server";
import type {
  ChatMessage,
  Evaluation,
  SessionWithRelations,
} from "@/lib/types";

export async function getSessionsForUser(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("simulation_sessions")
    .select(
      "*, products(id, name, base_price, usp, category), buyer_personas(id, partner_type, difficulty, system_prompt, min_acceptable_price), evaluations(id, rubric_scores, created_at)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[queries] sessions", error);
    return [] as SessionWithRelations[];
  }

  return (data ?? []) as unknown as SessionWithRelations[];
}

export async function getSessionDetail(sessionId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("simulation_sessions")
    .select(
      "*, products(id, name, base_price, usp, category), buyer_personas(id, partner_type, difficulty, system_prompt, min_acceptable_price)"
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[queries] session detail", error);
    return null;
  }

  return (data as unknown as SessionWithRelations) ?? null;
}

export async function getMessages(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[queries] messages", error);
    return [] as ChatMessage[];
  }

  return (data ?? []) as ChatMessage[];
}

export async function getEvaluation(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    console.error("[queries] evaluation", error);
    return null;
  }

  return (data as Evaluation) ?? null;
}

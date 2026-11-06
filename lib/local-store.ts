import {
  OPENING_MESSAGE_TEMPLATES,
  OPENING_MESSAGE_TEMPLATES_EN,
  getPartnerMeta,
} from "@/lib/ai/personas";
import type {
  ChatMessage,
  ChatRole,
  Difficulty,
  Evaluation,
  Language,
  PartnerType,
  ProductCategory,
  SessionOutcome,
} from "@/lib/types";

export interface LocalProduct {
  name: string;
  base_price: number;
  usp: string;
  category: ProductCategory;
}

export interface LocalSession {
  id: string;
  created_at: string;
  ended_at: string | null;
  status: "active" | "completed";
  outcome: SessionOutcome | null;
  product: LocalProduct;
  partner_type: PartnerType;
  difficulty: Difficulty;
  language?: Language;
  messages: ChatMessage[];
  evaluation: Evaluation | null;
}

const STORAGE_KEY = "siapdeal:sessions:v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readSessions(): LocalSession[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as LocalSession[]) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: LocalSession[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function listLocalSessions() {
  return readSessions().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getLocalSession(id: string) {
  return readSessions().find((session) => session.id === id) ?? null;
}

export function createLocalSession(input: {
  product: LocalProduct;
  partnerType: PartnerType;
  difficulty: Difficulty;
  language?: Language;
}) {
  const now = new Date().toISOString();
  const id = makeId();
  const meta = getPartnerMeta(input.partnerType);
  const language = input.language ?? "id";
  const template =
    language === "en"
      ? OPENING_MESSAGE_TEMPLATES_EN[input.partnerType]
      : OPENING_MESSAGE_TEMPLATES[input.partnerType];
  const greeting = template
    .replaceAll("{buyer}", meta.buyerName)
    .replaceAll("{company}", meta.company)
    .replaceAll("{product}", input.product.name);

  const session: LocalSession = {
    id,
    created_at: now,
    ended_at: null,
    status: "active",
    outcome: null,
    product: input.product,
    partner_type: input.partnerType,
    difficulty: input.difficulty,
    language,
    messages: [
      {
        id: makeId(),
        session_id: id,
        role: "assistant",
        content: greeting,
        created_at: now,
      },
    ],
    evaluation: null,
  };

  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);
  return session;
}

export function updateLocalSession(
  id: string,
  updater: (session: LocalSession) => LocalSession
) {
  const sessions = readSessions();
  const next = sessions.map((session) =>
    session.id === id ? updater(session) : session
  );
  writeSessions(next);
  return next.find((session) => session.id === id) ?? null;
}

export function saveLocalMessages(
  id: string,
  messages: Array<{ id: string; role: ChatRole; content: string }>
) {
  return updateLocalSession(id, (session) => ({
    ...session,
    messages: messages.map((message) => ({
      id: message.id,
      session_id: id,
      role: message.role,
      content: message.content,
      created_at:
        session.messages.find((item) => item.id === message.id)?.created_at ??
        new Date().toISOString(),
    })),
  }));
}

export function saveLocalEvaluation(
  id: string,
  evaluation: Evaluation,
  outcome: SessionOutcome
) {
  return updateLocalSession(id, (session) => ({
    ...session,
    status: "completed",
    outcome,
    ended_at: new Date().toISOString(),
    evaluation: {
      ...evaluation,
      id: evaluation.id || makeId(),
      session_id: id,
      created_at: evaluation.created_at || new Date().toISOString(),
    },
  }));
}

export function clearLocalSessions() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

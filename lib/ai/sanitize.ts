const CONTROL_TOKEN_PATTERN = /\s*\[\[\s*(?:DEAL|NO_DEAL)\s*\]\]\s*/gi;

const THINK_BLOCK_PATTERN =
  /<\s*(think|thinking|analysis|reasoning|internal)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

// Digunakan saat streaming: blok <think> yang belum ditutup harus
// disembunyikan sampai tag penutup datang, agar teks analisis tidak
// sempat tampil di UI.
const UNCLOSED_THINK_PATTERN =
  /<\s*(think|thinking|analysis|reasoning|internal)\b[^>]*>[\s\S]*$/i;

const STRAY_THINK_TAG_PATTERN =
  /<\/?\s*(?:think|thinking|analysis|reasoning|internal)\b[^>]*>/gi;

/**
 * Kalimat yang jelas-jelas merupakan proses berpikir / catatan parameter,
 * bukan dialog pembeli. Sengaja dibuat spesifik agar tidak memotong kalimat
 * negosiasi yang sah seperti "Saya perlu mempertimbangkan tawaran Anda."
 */
const INTERNAL_SENTENCE_PATTERNS: RegExp[] = [
  /^(?:wait|hold on|hmm+)\b[,:.\s-]/i,
  /^(?:let me|let'?s|the user|the buyer|the seller|i need to|i should|i must|we need to|we should)\b/i,
  /^(?:okay|ok|alright|so)[,:\s]+(?:let|i|we|the user)\b/i,
  /^(?:i'?ll|i am (?:going|now|checking|thinking))\b/i,
  /^(?:first|next|then)[,:\s]+(?:i|we|let)\b/i,
  /^(?:analysis|reasoning|thought|thoughts|internal note|note to self|chain of thought)\b/i,
  /^(?:analisis|catatan internal|proses berpikir|penalaran)\b/i,
  /^(?:#+\s*)?(?:analysis|reasoning|thought|internal)\s*:/i,
  /^(?:strategy|plan|constraints?|opening offer|note|nb)\s*:/i,
  /target negotiation parameters?/i,
  /re-?read (?:the )?(?:target|parameters?|prompt)/i,
  /reservation price/i,
  /secret (?:floor|ceiling)/i,
  /system prompt/i,
  /chain of thought/i,
  /internal (?:analysis|reasoning|note|monologue)/i,
  /parameter negosiasi/i,
  /batas harga rahasia/i,
  /instruksi sistem/i,
  /proses berpikir/i,
  /catatan parameter/i,
  /parameter internal/i,
];

export function stripControlTokens(text: string) {
  return text.replace(CONTROL_TOKEN_PATTERN, "").trim();
}

export function stripThinkBlocks(text: string) {
  return text
    .replace(THINK_BLOCK_PATTERN, " ")
    .replace(UNCLOSED_THINK_PATTERN, " ")
    .replace(STRAY_THINK_TAG_PATTERN, " ");
}

export function isInternalSentence(sentence: string) {
  const normalized = sentence
    .replace(/^[\s>*\-–—•]+/, "")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();

  if (!normalized) return false;
  return INTERNAL_SENTENCE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function stripBracketedParameterNotes(line: string) {
  return line
    .replace(
      /\((?:[^()]*(?:target negotiation|reservation price|secret floor|secret ceiling|system prompt|parameter|internal note)[^()]*)\)/gi,
      " "
    )
    .replace(
      /\[(?:[^\]]*(?:target negotiation|reservation price|secret floor|secret ceiling|system prompt|parameter|internal note)[^\]]*)\]/gi,
      " "
    );
}

/**
 * Menghapus kalimat pemikir internal per kalimat, bukan per baris.
 * Contoh: "Selamat pagi. Wait, let's re-read target negotiation parameters.
 * Harga kami Rp85.000." hanya kalimat kedua yang dibuang.
 */
export function stripInternalReasoning(text: string) {
  const cleaned = text
    .split(/\r?\n/)
    .map((line) => {
      const withoutNotes = stripBracketedParameterNotes(line);
      const sentences = withoutNotes.split(/(?<=[.!?])\s+/);
      return sentences
        .filter((sentence) => !isInternalSentence(sentence))
        .join(" ")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    })
    .join("\n");

  return cleaned
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Dipakai sebelum menyimpan pesan assistant ke database dan saat render.
 * Aman untuk teks streaming yang belum lengkap:
 * - <think> yang belum ditutup akan menyembunyikan sisa teks sementara.
 * - baris "Wait, let's..." langsung hilang begitu polanya terdeteksi.
 */
export function sanitizeAssistantText(text: string) {
  return stripInternalReasoning(stripControlTokens(stripThinkBlocks(text)));
}


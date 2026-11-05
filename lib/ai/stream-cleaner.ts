import {
  isInternalSentence,
  stripBracketedParameterNotes,
} from "@/lib/ai/sanitize";
import type { TextStreamPart, ToolSet } from "ai";

const TAG_NAMES = "think|thinking|analysis|reasoning|internal";
const CLOSE_TAG_RE = new RegExp(`<\\s*\\/\\s*(?:${TAG_NAMES})\\s*>`, "i");
const OPEN_TAG_RE = new RegExp(`<\\s*(?:${TAG_NAMES})\\b[^>]*>`, "i");
const PARTIAL_TAG_RE = /^<\s*[a-z]*$/i;

/**
 * Filter teks yang bekerja per potongan stream.
 *
 * Tujuan:
 * - Tidak ada teks <think>/analisis yang pernah dikirim ke frontend.
 * - Tetap streaming: output dikirim per kalimat yang sudah aman.
 * - Token [[DEAL]] / [[NO_DEAL]] sengaja DIPERTAHANKAN agar client masih
 *   bisa mendeteksi akhir sesi; token akan dibuang saat disimpan ke DB dan
 *   saat dirender.
 *
 * Kalimat internal yang muncul di tengah respons akan dibuang. Karena
 * output dikirim per kalimat, kalimat aman sebelumnya tidak ikut hilang.
 */
export class StreamingTextCleaner {
  private insideThink = false;
  private tagCarry = "";
  private lineBuffer = "";
  private pending = "";
  private hasEmitted = false;

  push(chunk: string): string {
    this.pending = "";
    const input = this.tagCarry + chunk;
    this.tagCarry = "";
    this.consumeTags(input);
    return this.take();
  }

  flush(): string {
    this.pending = "";

    if (!this.insideThink) {
      if (this.tagCarry) {
        this.processText(this.tagCarry);
        this.tagCarry = "";
      }
      if (this.lineBuffer) {
        this.emitSegment(this.lineBuffer);
        this.lineBuffer = "";
      }
    }

    return this.take();
  }

  private consumeTags(input: string) {
    let rest = input;

    while (rest.length > 0) {
      if (this.insideThink) {
        const close = rest.match(CLOSE_TAG_RE);

        if (!close || close.index === undefined) {
          // Simpan hanya kemungkinan potongan tag penutup.
          const ltIndex = rest.lastIndexOf("<");
          this.tagCarry =
            ltIndex >= 0 && rest.length - ltIndex <= 24
              ? rest.slice(ltIndex)
              : "";
          return;
        }

        rest = rest.slice(close.index + close[0].length);
        this.insideThink = false;
        continue;
      }

      const open = rest.match(OPEN_TAG_RE);
      if (open && open.index !== undefined) {
        this.processText(rest.slice(0, open.index));
        rest = rest.slice(open.index + open[0].length);
        this.insideThink = true;
        continue;
      }

      // Tahan potongan tag pembuka yang terpecah antar-chunk, mis. "<thi".
      const ltIndex = rest.lastIndexOf("<");
      if (ltIndex >= 0 && rest.length - ltIndex <= 24) {
        const tail = rest.slice(ltIndex);
        if (PARTIAL_TAG_RE.test(tail)) {
          this.processText(rest.slice(0, ltIndex));
          this.tagCarry = tail;
          return;
        }
      }

      this.processText(rest);
      rest = "";
    }
  }

  private processText(text: string) {
    this.lineBuffer += text;

    // Kirim per kalimat lengkap agar tetap terasa streaming.
    // Titik di dalam angka (Rp74.000) tidak boleh dianggap akhir kalimat.
    const sentencePattern = /((?:[^.!?\n]|\.(?=\d))+[.!?]+)(\s+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = sentencePattern.exec(this.lineBuffer)) !== null) {
      // Jangan pernah membuang teks yang tidak cocok di antara match.
      // Jika ada prefix yang terlewat, tahan seluruh baris sampai newline.
      if (match.index > lastIndex) break;

      const kept = this.emitSegment(match[1]);
      if (kept) {
        this.pending += match[2].includes("\n") ? "\n" : " ";
      }
      lastIndex = sentencePattern.lastIndex;
    }

    if (lastIndex > 0) {
      this.lineBuffer = this.lineBuffer.slice(lastIndex);
    }

    // Baris tanpa tanda baca tetap diproses saat newline datang.
    let newlineIndex = this.lineBuffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.lineBuffer.slice(0, newlineIndex);
      const kept = this.emitSegment(line);
      if (kept) this.pending += "\n";
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);
      newlineIndex = this.lineBuffer.indexOf("\n");
    }
  }

  private emitSegment(segment: string): boolean {
    const withoutNotes = stripBracketedParameterNotes(segment);
    if (!withoutNotes.trim()) return false;

    const sentences = withoutNotes.split(/(?<=[.!?])\s+/);
    const kept = sentences.filter(
      (sentence) => sentence.trim().length > 0 && !isInternalSentence(sentence)
    );

    if (kept.length === 0) return false;

    const text = kept.join(" ").replace(/[ \t]{2,}/g, " ").trim();
    if (!text) return false;

    this.pending += text;
    return true;
  }

  private take(): string {
    let output = this.pending;
    this.pending = "";

    if (!this.hasEmitted) {
      output = output.replace(/^\s+/, "");
      if (output) this.hasEmitted = true;
    }

    return output
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n");
  }
}

/**
 * TransformStream untuk `experimental_transform` pada `streamText()`.
 * Reasoning part dari provider dibuang total; text-delta dibersihkan
 * sebelum dikirim ke frontend.
 */
export function createCleanTextTransform<
  TOOLS extends ToolSet = ToolSet,
>() {
  return (_options: { tools: TOOLS; stopStream: () => void }) => {
    const cleaner = new StreamingTextCleaner();

    return new TransformStream<
      TextStreamPart<TOOLS>,
      TextStreamPart<TOOLS>
    >({
      transform(part, controller) {
        if (part.type === "reasoning") {
          return;
        }

        if (part.type !== "text-delta") {
          controller.enqueue(part);
          return;
        }

        const clean = cleaner.push(part.textDelta);
        if (clean) {
          controller.enqueue({ type: "text-delta", textDelta: clean });
        }
      },
      flush(controller) {
        const clean = cleaner.flush();
        if (clean) {
          controller.enqueue({ type: "text-delta", textDelta: clean });
        }
      },
    });
  };
}


"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "ai/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  CircleStop,
  Handshake,
  Hotel,
  Info,
  Lightbulb,
  Loader2,
  MessagesSquare,
  Mic,
  PanelRight,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
  Waves,
  XCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { detectOutcome } from "@/lib/ai/buyer-prompt";
import { sanitizeAssistantText } from "@/lib/ai/sanitize";
import {
  DIFFICULTY_META,
  PARTNER_META,
} from "@/lib/ai/personas";
import type {
  ChatMessage,
  Difficulty,
  Evaluation,
  PartnerType,
  ProductCategory,
  SessionOutcome,
} from "@/lib/types";
import { saveLocalEvaluation, saveLocalMessages } from "@/lib/local-store";
import { cn } from "@/lib/utils";
import { ScenarioPanel } from "@/components/simulation/scenario-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ChatProduct {
  name: string;
  base_price: number;
  usp: string;
  category: ProductCategory;
}

interface RecordingSession {
  context: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
  gain: GainNode;
  chunks: Float32Array[];
}

function mergeAudioChunks(chunks: Float32Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

interface NegotiationChatProps {
  sessionId: string;
  product: ChatProduct;
  partnerType: PartnerType;
  difficulty: Difficulty;
  initialMessages: ChatMessage[];
  isJudge?: boolean;
}

const MAX_CHARS = 1500;

type MicPermission = "unknown" | "granted" | "denied" | "prompt";

export function NegotiationChat({
  sessionId,
  product,
  partnerType,
  difficulty,
  initialMessages,
  isJudge = false,
}: NegotiationChatProps) {
  const router = useRouter();
  const partner = PARTNER_META[partnerType];
  const diff = DIFFICULTY_META[difficulty];
  const PartnerIcon =
    partnerType === "hotel_resort_bali"
      ? Hotel
      : partnerType === "souvenir_retail"
        ? Store
        : Waves;

  const [endOpen, setEndOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [autoOutcome, setAutoOutcome] = useState<Exclude<SessionOutcome, "manual"> | null>(
    null
  );

  const autoTriggeredRef = useRef(false);
  const evaluationInFlightRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const didInitialScrollRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingRef = useRef<RecordingSession | null>(null);
  const messagesRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;

    let active = true;
    let status: PermissionStatus | null = null;

    const sync = () => {
      if (active && status) {
        setMicPermission(status.state as MicPermission);
      }
    };

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (!active) return;
        status = result;
        setMicPermission(result.state as MicPermission);
        result.addEventListener("change", sync);
      })
      .catch(() => {
        // Browser tidak mendukung query permission mikrofon.
      });

    return () => {
      active = false;
      status?.removeEventListener("change", sync);
    };
  }, []);

  const finishSession = useCallback(
    async (outcome: SessionOutcome) => {
      if (evaluationInFlightRef.current) return;
      evaluationInFlightRef.current = true;
      setIsEvaluating(true);
      setEvaluationError(null);
      setEndOpen(false);

      try {
        const response = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            outcome,
            product,
            partnerType,
            difficulty,
            messages: messagesRef.current,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string; evaluation?: Evaluation }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || "Evaluasi gagal dijalankan.");
        }

        if (!payload?.evaluation) {
          throw new Error("Evaluasi tidak mengembalikan hasil.");
        }

        saveLocalEvaluation(sessionId, payload.evaluation, outcome);
        toast.success("Evaluasi selesai. Membuka hasil...");
        router.push(`/simulasi/${sessionId}/hasil`);
        router.refresh();
      } catch (error) {
        evaluationInFlightRef.current = false;
        setIsEvaluating(false);
        const message =
          error instanceof Error
            ? error.message
            : "Evaluasi gagal dijalankan. Silakan coba lagi.";
        setEvaluationError(message);
        toast.error(message);
      }
    },
    [router, sessionId, product, partnerType, difficulty]
  );

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: chatError,
    reload,
  } = useChat({
    api: "/api/chat",
    body: { product, partnerType, difficulty },
    initialMessages: initialMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    })),
    onFinish: (message) => {
      const detected = detectOutcome(message.content);
      if (!detected || autoTriggeredRef.current) return;

      autoTriggeredRef.current = true;
      setAutoOutcome(detected);

      timeoutRef.current = setTimeout(() => {
        void finishSession(detected);
      }, 1800);
    },
    onError: (chatError) => {
      toast.error(
        chatError.message || "Koneksi ke pembeli virtual terputus. Coba lagi."
      );
    },
  });

  useEffect(() => {
    const conversation = messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant",
        content: message.content,
      }));

    messagesRef.current = conversation.map(({ role, content }) => ({ role, content }));

    if (conversation.length > 0) {
      saveLocalMessages(sessionId, conversation);
    }
  }, [messages, sessionId]);

  const locked = isEvaluating || autoOutcome !== null;
  const hasUserMessage = messages.some((message) => message.role === "user");

  const stopVoiceInput = async () => {
    const session = recordingRef.current;
    if (!session) return;

    recordingRef.current = null;
    setIsListening(false);

    const sampleRate = session.context.sampleRate;
    const chunks = session.chunks.slice();

    session.processor.onaudioprocess = null;
    session.source.disconnect();
    session.processor.disconnect();
    session.gain.disconnect();
    session.stream.getTracks().forEach((track) => track.stop());
    void session.context.close();

    const samples = mergeAudioChunks(chunks);
    if (samples.length < sampleRate * 0.25) {
      toast.error("Rekaman terlalu pendek. Coba bicara lebih jelas.");
      return;
    }

    const rms = Math.sqrt(
      samples.reduce((total, sample) => total + sample * sample, 0) /
        samples.length
    );
    if (rms < 0.001) {
      toast.error(
        "Tidak ada suara yang terdeteksi. Pastikan mikrofon aktif dan coba lagi."
      );
      return;
    }

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append(
        "audio",
        new Blob([encodeWav(samples, sampleRate)], { type: "audio/wav" }),
        "voice.wav"
      );

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; text?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Gagal memproses suara.");
      }

      const transcript = payload?.text?.trim();
      if (!transcript) {
        throw new Error("Tidak ada suara yang bisa dikenali. Coba lagi.");
      }

      setInput((current) =>
        current.trim() ? `${current.trim()} ${transcript}` : transcript
      );
      textareaRef.current?.focus();
      toast.success("Suara berhasil diubah menjadi teks.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Input suara gagal. Coba lagi."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const startVoiceInput = async () => {
    if (typeof window === "undefined" || recordingRef.current) return;

    if (micPermission === "denied") {
      toast.error(
        "Akses mikrofon masih diblokir. Aktifkan lewat pengaturan situs di browser, lalu muat ulang halaman."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Browser ini belum mendukung perekaman suara.");
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setMicPermission("granted");

      const AudioCtor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioCtor) {
        throw new Error("Browser ini belum mendukung perekaman suara.");
      }

      const context = new AudioCtor();
      await context.resume();

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const gain = context.createGain();
      gain.gain.value = 0;

      const chunks: Float32Array[] = [];
      processor.onaudioprocess = (event) => {
        const data = event.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(data));
      };

      source.connect(processor);
      processor.connect(gain);
      gain.connect(context.destination);

      recordingRef.current = {
        context,
        stream,
        source,
        processor,
        gain,
        chunks,
      };
      setIsListening(true);
      toast.info("Merekam... tekan mikrofon lagi untuk berhenti.");
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());

      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setMicPermission("denied");
      }
      const message =
        name === "NotAllowedError" || name === "SecurityError"
          ? "Izin mikrofon ditolak. Aktifkan izin mikrofon di browser."
          : name === "NotFoundError"
            ? "Mikrofon tidak ditemukan."
            : name === "NotReadableError"
              ? "Mikrofon sedang dipakai aplikasi lain."
              : error instanceof Error
                ? error.message
                : "Input suara gagal. Coba lagi.";

      toast.error(message);
    }
  };

  const toggleVoiceInput = () => {
    if (recordingRef.current) {
      void stopVoiceInput();
    } else {
      void startVoiceInput();
    }
  };

  const coachSuggestions = [
    {
      id: "volume",
      tag: "Buka",
      icon: MessagesSquare,
      title: "Tanyakan volume & kebutuhan",
      body: "Buka ruang negosiasi dengan data, bukan langsung diskon.",
      example: `Bapak/Ibu, untuk kebutuhan ${product.name}, berapa volume ideal per bulan? Saya bisa siapkan skema harga bertingkat.`,
    },
    {
      id: "trade",
      tag: "Tukar",
      icon: ArrowLeftRight,
      title: "Tukar konsesi dengan syarat",
      body: "Setiap penurunan harga harus dibayar dengan komitmen lain.",
      example:
        "Saya bisa menyesuaikan harga jika TOP dipersingkat menjadi 30 hari dan ada komitmen volume minimal 100 pcs.",
    },
    {
      id: "terms",
      tag: "Termin",
      icon: Wallet,
      title: "Jawab tuntutan termin",
      body: "Respons keberatan TOP atau titip jual dengan alternatif konkret.",
      example:
        "Kami belum bisa membuka TOP 60 hari, tetapi bisa mulai dari TOP 21 hari untuk batch pertama sambil kami evaluasi bersama.",
    },
    {
      id: "close",
      tag: "Kunci",
      icon: Handshake,
      title: "Kunci langkah lanjutan",
      body: "Closing konkret menurunkan risiko keputusan menggantung.",
      example:
        "Boleh kita kunci uji coba 2 minggu untuk 100 pcs, lalu review bersama pada akhir bulan?",
    },
  ];

  const lastAssistantText =
    [...messages]
      .reverse()
      .find((message) => message.role === "assistant")
      ?.content.toLowerCase() ?? "";
  const coachFocus = !hasUserMessage
    ? "volume"
    : /harga|diskon|mahal|margin|rp/.test(lastAssistantText)
      ? "trade"
      : /top|termin|pembayaran|konsinyasi|titip jual/.test(lastAssistantText)
        ? "terms"
        : /volume|moq|kebutuhan/.test(lastAssistantText)
          ? "volume"
          : "close";
  const orderedCoachSuggestions = [
    ...coachSuggestions.filter((suggestion) => suggestion.id === coachFocus),
    ...coachSuggestions.filter((suggestion) => suggestion.id !== coachFocus),
  ];

  const quickStarts = [
    { label: "Tanya volume", text: coachSuggestions[0].example },
    { label: "Tukar konsesi", text: coachSuggestions[1].example },
    { label: "Kunci uji coba", text: coachSuggestions[3].example },
  ];

  const applyCoachSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setCoachOpen(false);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (!didInitialScrollRef.current) {
      if (messages.length === 0) return;
      container.scrollTo({
        top: messages.length === 1 ? 0 : container.scrollHeight,
        behavior: "auto",
      });
      didInitialScrollRef.current = true;
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, autoOutcome, evaluationError]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const session = recordingRef.current;
      if (session) {
        recordingRef.current = null;
        session.processor.onaudioprocess = null;
        session.source.disconnect();
        session.processor.disconnect();
        session.gain.disconnect();
        session.stream.getTracks().forEach((track) => track.stop());
        void session.context.close();
      }
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const maxHeight = window.matchMedia("(max-width: 1023px)").matches
      ? 112
      : 132;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [input]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom < 160) {
      container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    }
  }, [input]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const root = rootRef.current;
    if (!viewport || !root) return;

    const sync = () => {
      if (!window.matchMedia("(max-width: 1023px)").matches) return;
      const keyboardHeight = window.innerHeight - viewport.height;

      if (keyboardHeight > 120) {
        root.style.height = `${viewport.height}px`;
      } else {
        root.style.removeProperty("height");
      }
    };

    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);

    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      root.style.removeProperty("height");
    };
  }, []);

  const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading || locked) return;
    handleSubmit(event);
  };

  const handleManualEnd = () => {
    if (!hasUserMessage) {
      toast.error("Kirim minimal satu pesan negosiasi sebelum mengakhiri sesi.");
      return;
    }
    void finishSession("manual");
  };

  const outcomeBanner =
    autoOutcome === "deal"
      ? {
          icon: CheckCircle2,
          title: "Kesepakatan tercapai!",
          description:
            "Pembeli virtual menyatakan sepakat. AI sedang menyusun evaluasi negosiasi Anda.",
          className: "border-brand-teal/25 bg-brand-teal/10 text-brand-navy",
          iconClass: "text-brand-navy",
        }
      : autoOutcome === "no_deal"
        ? {
            icon: XCircle,
            title: "Negosiasi berakhir tanpa kesepakatan",
            description:
              "Pembeli virtual mengakhiri negosiasi. Tetap ada pelajaran berharga, AI sedang menilai cara Anda.",
            className:
              "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
            iconClass: "text-rose-700",
          }
        : null;

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 flex-col overflow-hidden bg-background lg:gap-3 lg:overflow-visible lg:bg-transparent"
    >
      {/* Mobile header — compact, immersive, thumb-friendly */}
      <div className="shrink-0 lg:hidden">
        <div className="bg-card pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center gap-2 px-3">
            <Link
              href="/dashboard"
              className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors active:bg-muted"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="relative shrink-0">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/10">
                <PartnerIcon className="h-[18px] w-[18px]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <p className="truncate text-base font-bold leading-tight text-foreground">
                  {partner.buyerName}
                </p>
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-brand-teal/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-brand-navy">
                  <Sparkles className="h-2 w-2" />
                  AI
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                Online · {partner.buyerRole}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEndOpen(true)}
              disabled={locked}
              aria-label="Selesaikan sesi dan lihat evaluasi"
              className="-mr-1 inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-rose-50 px-3 text-[11px] font-semibold text-rose-700 transition-colors active:bg-rose-100 disabled:opacity-40 dark:bg-rose-500/15 dark:text-rose-300 dark:active:bg-rose-500/25"
            >
              <CircleStop className="h-3.5 w-3.5" />
              Akhiri
            </button>
          </div>

          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="Buka detail skenario"
            className="flex w-full items-center gap-2 border-t border-border/60 bg-muted/40 px-4 py-2 text-left transition-colors active:bg-muted/60"
          >
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-navy dark:text-brand-mint">
              SiapDeal AI
            </span>
            <span className="h-3 w-px shrink-0 bg-border" />
            <span className="min-w-0 truncate text-[11px] font-semibold text-foreground">
              {product.name}
            </span>
            <span className="shrink-0 rounded-full bg-card px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground ring-1 ring-inset ring-border/70">
              Level {diff.label}
            </span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          </button>
          <div className="h-0.5 bg-[linear-gradient(90deg,hsl(var(--brand-teal)),hsl(var(--brand-mint)),hsl(var(--brand-navy)))]" />
        </div>
      </div>

      {/* Desktop top bar */}
      <div className="hidden shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition duration-200 hover:border-brand-teal/25 hover:text-brand-navy"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="border-border bg-card text-[10px] text-muted-foreground">
                {partner.shortLabel}
              </Badge>
              <Badge
                variant={difficulty === "hard" ? "destructive" : difficulty === "medium" ? "warning" : "success"}
                className="text-[10px]"
              >
                Level: {diff.label}
              </Badge>
              <span className="text-[10px] font-semibold text-brand-navy">
                Sesi aktif, {isJudge ? "Mode Demo" : "Fast Demo"}
              </span>
            </div>
            <h1 className="mt-1 truncate font-display text-lg font-bold leading-tight text-foreground sm:text-xl">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-auto min-h-9 gap-1.5 border-border bg-card text-[11px] text-muted-foreground hover:border-brand-teal/25 hover:text-brand-navy xl:hidden"
            onClick={() => setInfoOpen(true)}
          >
            <PanelRight className="h-4 w-4" />
            Detail Skenario
          </Button>
          <Button
            size="sm"
            className="h-auto min-h-9 w-full shrink-0 gap-1.5 whitespace-normal border border-rose-200 bg-rose-50 px-4 py-2 text-[11px] font-semibold text-rose-700 shadow-sm transition duration-200 hover:bg-rose-100 sm:w-auto sm:text-xs"
            onClick={() => setEndOpen(true)}
            disabled={locked}
          >
            <CircleStop className="h-4 w-4" />
            Selesaikan &amp; Lihat Evaluasi Deal
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative flex min-h-0 flex-col overflow-hidden bg-background lg:rounded-2xl lg:border lg:border-border/80 lg:bg-card lg:shadow-soft">
          {/* Desktop chat header */}
          <div className="hidden shrink-0 items-center justify-between bg-primary px-4 py-3.5 text-primary-foreground lg:flex">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
                <PartnerIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-bold leading-tight text-primary-foreground">
                    {partner.buyerName}
                  </p>
                  <Badge
                    variant="outline"
                    className="border-primary-foreground/15 bg-primary-foreground/10 text-[9px] font-medium text-primary-foreground/75"
                  >
                    Mitra B2B
                  </Badge>
                </div>
                <p className="truncate text-[10px] text-primary-foreground/60">
                  {partner.buyerRole}, {partner.company}
                </p>
                <p className="mt-0.5 text-[9px] text-primary-foreground/55">
                  Online, siap bernegosiasi
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-primary-foreground/15 bg-primary-foreground/10 text-[9px] text-primary-foreground/80"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              AI Negotiator
            </Badge>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            className="chat-scroll flex flex-1 flex-col overflow-y-auto bg-background px-3.5 py-4 sm:px-5 lg:bg-background"
          >
            <div className="flex flex-col gap-3.5 lg:gap-4">
              <div className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-[10px] font-medium leading-relaxed text-muted-foreground">
                <ShieldCheck className="h-3 w-3 shrink-0 text-brand-teal" />
                <span className="truncate">Sesi latihan · AI berperan sebagai pembeli</span>
              </div>

              {messages.map((message, index) => {
              const isUser = message.role === "user";
              const content = isUser
                ? message.content
                : sanitizeAssistantText(message.content);

              if (!content) return null;

              const previous = messages[index - 1];
              const startsGroup = !previous || previous.role !== message.role;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full flex-col",
                    isUser ? "items-end" : "items-start"
                  )}
                >
                  {!isUser && startsGroup && (
                    <p className="mb-1 pl-9 text-[10px] font-medium leading-tight text-muted-foreground">
                      {partner.buyerName} · {partner.company}
                    </p>
                  )}
                  <div
                    className={cn(
                      "flex w-full items-start gap-2",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser && (
                      <div
                        className={cn(
                          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/10",
                          !startsGroup && "invisible"
                        )}
                      >
                        <PartnerIcon className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[calc(100%-2.25rem)] whitespace-pre-wrap break-words px-3.5 py-2.5 text-[15px] leading-[1.62] shadow-sm sm:max-w-[78%]",
                        isUser
                          ? "rounded-[18px] rounded-br-md bg-primary text-primary-foreground dark:border dark:border-white/10 dark:bg-brand-navy-soft dark:text-white"
                          : "rounded-[18px] rounded-bl-md border border-border/70 bg-card text-foreground"
                      )}
                    >
                      {content}
                    </div>
                  </div>
                </div>
              );
              })}

              {isLoading && (
                <div className="flex w-full flex-col items-start">
                  <p className="mb-1 pl-9 text-[10px] font-medium leading-tight text-brand-navy">
                    {partner.buyerName} sedang mengetik…
                  </p>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/10">
                      <PartnerIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-[18px] rounded-bl-md border border-border/70 bg-card px-3.5 py-3.5 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-navy/50 motion-reduce:animate-none" />
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-navy/50 [animation-delay:150ms] motion-reduce:animate-none" />
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-navy/50 [animation-delay:300ms] motion-reduce:animate-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer / composer */}
          <div className="shrink-0 border-t border-border/70 bg-card px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 lg:p-4">
            {outcomeBanner && (
              <div className={cn("mb-2.5 flex items-start gap-2.5 rounded-xl border p-3", outcomeBanner.className)}>
                <outcomeBanner.icon className={cn("mt-0.5 h-4 w-4 shrink-0", outcomeBanner.iconClass)} />
                <div className="min-w-0">
                  <p className="text-xs font-bold">{outcomeBanner.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">
                    {outcomeBanner.description}
                  </p>
                  {isEvaluating && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Menganalisis transkrip & menyusun skor…
                    </p>
                  )}
                  {evaluationError && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium text-rose-700">
                        {evaluationError}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 bg-card text-[11px]"
                        onClick={() => void finishSession(autoOutcome ?? "manual")}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Coba lagi
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {chatError && (
              <Alert variant="destructive" className="mb-2.5 py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span className="text-xs">{chatError.message}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 bg-card text-[11px]"
                    onClick={() => reload()}
                  >
                    Coba lagi
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {evaluationError && !outcomeBanner && (
              <Alert variant="destructive" className="mb-2.5 py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span className="text-xs">{evaluationError}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 bg-card text-[11px]"
                    onClick={() => void finishSession("manual")}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Ulangi evaluasi
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {micPermission === "denied" && (
              <div
                role="alert"
                className="mb-2.5 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] leading-relaxed text-destructive"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p className="min-w-0 flex-1">
                  <span className="font-semibold">Mikrofon diblokir.</span> Izinkan
                  lewat ikon kunci di address bar, lalu muat ulang.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 border-destructive/20 bg-card px-2.5 text-[10px] text-destructive"
                  onClick={() => window.location.reload()}
                >
                  Muat ulang
                </Button>
              </div>
            )}

            {!hasUserMessage && !locked && (
              <div className="mb-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                  Mulai
                </span>
                {quickStarts.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => {
                      setInput(starter.text);
                      textareaRef.current?.focus();
                    }}
                    className="shrink-0 rounded-full border border-brand-teal/25 bg-brand-teal/5 px-3.5 py-2 text-[11px] font-semibold text-brand-navy transition-colors active:bg-brand-teal/15"
                  >
                    {starter.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-2 hidden w-full flex-wrap items-center justify-between gap-2 lg:flex">
              <button
                type="button"
                onClick={() => setCoachOpen(true)}
                disabled={locked}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/25 bg-brand-teal/10 px-3 py-1.5 text-[10px] font-semibold text-brand-navy transition-colors hover:bg-brand-teal/15 disabled:opacity-50"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Tanya Coach AI
              </button>
              <span className="text-[10px] text-muted-foreground/80">
                Saran cepat, bukan jawaban otomatis
              </span>
            </div>

            <form
              onSubmit={submitMessage}
              className="flex items-end gap-1 rounded-[24px] border border-border/80 bg-card p-1.5 shadow-sm transition focus-within:border-brand-teal/40 focus-within:ring-2 focus-within:ring-brand-teal/15 dark:bg-background"
            >
              <button
                type="button"
                onClick={() => setCoachOpen(true)}
                disabled={locked}
                aria-label="Buka saran Coach AI"
                title="Coach AI"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-teal/10 text-brand-navy transition-colors active:bg-brand-teal/20 disabled:opacity-40 lg:hidden"
              >
                <Lightbulb className="h-[18px] w-[18px]" />
              </button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => {
                  if (event.target.value.length <= MAX_CHARS) {
                    handleInputChange(event);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder={
                  locked ? "Sesi sedang dievaluasi…" : "Tulis respons negosiasi…"
                }
                disabled={locked}
                maxLength={MAX_CHARS}
                className="min-h-0 flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-[16px] leading-[1.45] shadow-none placeholder:text-muted-foreground/60 focus-visible:border-0 focus-visible:ring-0 lg:text-sm"
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={locked || isLoading || isTranscribing}
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground/80 transition-colors active:bg-muted disabled:opacity-50",
                  isListening && "bg-rose-50 text-rose-600"
                )}
                aria-label={
                  isListening
                    ? "Berhenti merekam suara"
                    : isTranscribing
                      ? "Mentranskripsi suara"
                      : "Input suara"
                }
                aria-pressed={isListening}
                title={
                  isListening
                    ? "Berhenti merekam"
                    : isTranscribing
                      ? "Mentranskripsi suara..."
                      : "Input suara"
                }
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className={cn("h-[18px] w-[18px]", isListening && "animate-pulse")} />
                )}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || locked || isLoading}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition duration-200 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/80 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-white/30"
                aria-label="Kirim pesan"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-[18px] w-[18px]" />
                )}
              </button>
            </form>

            {(isListening || isTranscribing || input.length > MAX_CHARS - 150) && (
              <div className="mt-1 flex items-center justify-between gap-2 px-2 text-[10px]">
                <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-brand-navy">
                  {(isListening || isTranscribing) && (
                    <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-teal" />
                  )}
                  <span className="truncate">
                    {isTranscribing
                      ? "Mentranskripsi suara..."
                      : isListening
                        ? "Merekam... tekan mikrofon untuk berhenti"
                        : ""}
                  </span>
                </span>
                {input.length > MAX_CHARS - 150 && (
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      input.length >= MAX_CHARS ? "text-rose-600" : "text-muted-foreground/80"
                    )}
                  >
                    {input.length}/{MAX_CHARS}
                  </span>
                )}
              </div>
            )}
          </div>

          {isEvaluating && !autoOutcome && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
              <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lift">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
                <p className="mt-4 font-display text-lg font-bold text-foreground">
                  AI sedang menilai negosiasi Anda
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Transkrip dianalisis dengan 5 aspek rubrik. Proses ini biasanya
                  memakan waktu 10 sampai 20 detik.
                </p>
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary/50" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary/50 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary/50 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar desktop */}
        <aside className="hidden min-h-0 space-y-3 overflow-y-auto pr-0.5 xl:block">
          <ScenarioPanel
            product={product}
            partnerType={partnerType}
            difficulty={difficulty}
          />
        </aside>
      </div>

      {/* Mobile scenario drawer */}
      {infoOpen && (
        <div
          className="fixed inset-0 z-[60] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Detail skenario"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setInfoOpen(false)}
            aria-label="Tutup detail skenario"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-border bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background px-4 pb-3 pt-2">
              <div className="mx-auto h-1 w-10 rounded-full bg-border" />
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">
                    Detail Skenario
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Konteks, strategi, dan rubrik penilaian
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ThemeToggle
                    label={false}
                    className="h-11 w-11 border border-border/70 bg-card px-0"
                  />
                  <button
                    type="button"
                    onClick={() => setInfoOpen(false)}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="mt-4">
                <ScenarioPanel
                  product={product}
                  partnerType={partnerType}
                  difficulty={difficulty}
                />
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setInfoOpen(false);
                    setEndOpen(true);
                  }}
                  disabled={locked}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition-colors active:bg-rose-100 disabled:opacity-40 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:active:bg-rose-500/20"
                >
                  <CircleStop className="h-4 w-4" />
                  Selesaikan &amp; lihat evaluasi
                </button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Sesi juga berakhir otomatis saat deal atau buntu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach dialog */}
      <Dialog open={coachOpen} onOpenChange={setCoachOpen}>
        <DialogContent className="max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90dvh] max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DialogHeader className="pr-10">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-teal/10 text-brand-navy dark:text-brand-mint">
                <Lightbulb className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="text-lg">Coach AI</DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  Saran kontekstual untuk balasan berikutnya.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            <span className="max-w-full truncate rounded-full border border-border/70 bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {product.name}
            </span>
            <span className="rounded-full border border-brand-teal/25 bg-brand-teal/10 px-2 py-1 text-[10px] font-medium text-brand-navy dark:text-brand-mint">
              Level {diff.label}
            </span>
            <span className="rounded-full border border-border/70 bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {partner.shortLabel}
            </span>
          </div>

          <div className="space-y-2">
            {orderedCoachSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => applyCoachSuggestion(suggestion.example)}
                className="group w-full rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-brand-teal/40 hover:bg-brand-teal/[0.04] active:bg-brand-teal/[0.08]"
              >
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-teal/10 text-brand-navy dark:text-brand-mint">
                    <suggestion.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-brand-teal/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-navy dark:text-brand-mint">
                        {suggestion.tag}
                      </span>
                      <p className="text-xs font-bold text-foreground">
                        {suggestion.title}
                      </p>
                      {suggestion.id === coachFocus && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                          Disarankan
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {suggestion.body}
                    </p>
                    <p className="mt-2 rounded-lg border border-border/70 bg-background/70 p-2.5 text-[11px] italic leading-relaxed text-muted-foreground">
                      “{suggestion.example}”
                    </p>
                  </div>
                </div>
                <span className="mt-2 flex items-center justify-end gap-1 text-[10px] font-semibold text-brand-navy dark:text-brand-mint">
                  Masukkan ke chat
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCoachOpen(false);
                setInfoOpen(true);
              }}
            >
              Lihat strategi lengkap
            </Button>
            <Button variant="ghost" onClick={() => setCoachOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End session dialog */}
      <Dialog open={endOpen} onOpenChange={setEndOpen}>
        <DialogContent className="max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90dvh] max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DialogHeader>
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-rose-600">
              <CircleStop className="h-5 w-5" />
            </div>
            <DialogTitle>Selesaikan &amp; lihat evaluasi deal?</DialogTitle>
            <DialogDescription>
              Percakapan akan ditutup dan AI menilai seluruh transkrip dengan
              rubrik 5 aspek. Hasilnya langsung tersedia di halaman evaluasi.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/50 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Ringkasan sesi</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between gap-3">
                <span>Produk</span>
                <span className="truncate font-medium text-foreground">{product.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Mitra</span>
                <span className="font-medium text-foreground">
                  {partner.shortLabel}, {diff.label}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Pesan Anda</span>
                <span className="font-medium text-foreground">
                  {messages.filter((message) => message.role === "user").length} pesan
                </span>
              </div>
            </div>
          </div>

          {!hasUserMessage && (
            <p className="flex items-start gap-1.5 text-xs text-brand-navy">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Anda belum mengirim pesan. Kirim minimal satu respons agar AI bisa
              menilai negosiasi.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEndOpen(false)}>
              Lanjutkan negosiasi
            </Button>
            <Button
              onClick={handleManualEnd}
              disabled={isEvaluating || !hasUserMessage}
              className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyusun evaluasi…
                </>
              ) : (
                <>
                  <CircleStop className="h-4 w-4" />
                  Selesaikan &amp; Lihat Evaluasi Deal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

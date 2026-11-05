"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "ai/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleStop,
  Hotel,
  Info,
  Lightbulb,
  Loader2,
  Mic,
  PanelRight,
  RotateCcw,
  Send,
  Sparkles,
  Store,
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
  PartnerType,
  ProductCategory,
  SessionOutcome,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScenarioPanel } from "@/components/simulation/scenario-panel";
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
  const didInitialScrollRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingRef = useRef<RecordingSession | null>(null);

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
          body: JSON.stringify({ sessionId, outcome }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string; evaluation?: unknown }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || "Evaluasi gagal dijalankan.");
        }

        toast.success("Evaluasi selesai. Membuka hasil…");
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
    [router, sessionId]
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
    body: { sessionId },
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
      title: "Tanyakan volume & kebutuhan",
      body: "Buka ruang negosiasi dengan data, bukan langsung diskon.",
      example: `Bapak/Ibu, untuk kebutuhan ${product.name}, berapa volume ideal per bulan? Saya bisa siapkan skema harga bertingkat.`,
    },
    {
      title: "Tukar konsesi dengan syarat",
      body: "Setiap penurunan harga harus dibayar dengan komitmen lain.",
      example:
        "Saya bisa menyesuaikan harga jika TOP dipersingkat menjadi 30 hari dan ada komitmen volume minimal 100 pcs.",
    },
    {
      title: "Kunci langkah lanjutan",
      body: "Closing konkret menurunkan risiko keputusan menggantung.",
      example:
        "Boleh kita kunci uji coba 2 minggu untuk 100 pcs, lalu review bersama pada akhir bulan?",
    },
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
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [input]);

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
            className: "border-rose-200 bg-rose-50 text-rose-900",
            iconClass: "text-rose-700",
          }
        : null;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Top bar */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-200 hover:border-brand-teal/25 hover:text-brand-navy"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="border-slate-200 bg-white text-[10px] text-slate-600">
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
            <h1 className="mt-1 truncate font-display text-lg font-bold leading-tight text-ink sm:text-xl">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-auto min-h-9 gap-1.5 border-slate-200 bg-white text-[11px] text-slate-600 hover:border-brand-teal/25 hover:text-brand-navy xl:hidden"
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
        <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
          {/* Chat header */}
          <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3.5 text-primary-foreground">
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
            className="chat-scroll flex-1 space-y-4 overflow-y-auto bg-background px-3 py-4 sm:px-5"
          >
            <div className="mx-auto max-w-md rounded-xl border border-border bg-card px-3 py-2 text-center text-[10px] leading-relaxed text-muted-foreground">
              Simulasi latihan. AI memerankan pembeli profesional dan tidak
              mewakili perusahaan nyata.
            </div>

            {messages.map((message) => {
              const isUser = message.role === "user";
              const content = isUser
                ? message.content
                : sanitizeAssistantText(message.content);

              if (!content) return null;

              return (
                <div key={message.id} className={cn(isUser ? "" : "space-y-1")}>
                  {!isUser && (
                    <p className="pl-9 text-[9px] font-medium text-muted-foreground">
                      {partner.buyerRole}, {partner.company}
                    </p>
                  )}
                  <div
                    className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
                  >
                    {!isUser && (
                      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                        <PartnerIcon className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[86%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm sm:max-w-[78%] sm:text-sm",
                        isUser
                          ? "rounded-tr-none bg-primary text-primary-foreground"
                          : "rounded-tl-none border border-border bg-card text-foreground"
                      )}
                    >
                      {content}
                    </div>
                    {isUser && (
                      <div className="mt-0.5 hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-primary-foreground sm:grid">
                        Anda
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="space-y-1">
                <p className="pl-9 text-[9px] font-medium text-muted-foreground">
                  {partner.buyerRole}, {partner.company}
                </p>
                <div className="flex gap-2.5">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                    <PartnerIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-border bg-card px-4 py-3 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary motion-reduce:animate-none" />
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary [animation-delay:150ms] motion-reduce:animate-none" />
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary [animation-delay:300ms] motion-reduce:animate-none" />
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      {partner.buyerName} sedang meninjau penawaran Anda…
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer / input */}
          <div className="shrink-0 border-t border-border/70 bg-white p-3 sm:p-4">
            {outcomeBanner && (
              <div className={cn("mb-3 flex items-start gap-2.5 rounded-xl border p-3", outcomeBanner.className)}>
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
                        className="h-7 bg-white text-[11px]"
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
              <Alert variant="destructive" className="mb-3 py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span className="text-xs">{chatError.message}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 bg-white text-[11px]"
                    onClick={() => reload()}
                  >
                    Coba lagi
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {evaluationError && !outcomeBanner && (
              <Alert variant="destructive" className="mb-3 py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span className="text-xs">{evaluationError}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 bg-white text-[11px]"
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
                className="mb-2 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[11px] leading-relaxed text-destructive"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Akses mikrofon diblokir</p>
                  <p className="mt-0.5">
                    Klik ikon kunci atau pengaturan situs di address bar, pilih
                    Mikrofon, lalu Izinkan. Di Windows, aktifkan juga Settings →
                    Privacy &amp; security → Microphone → Let desktop apps access
                    your microphone.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 border-destructive/20 bg-white text-[10px] text-destructive"
                  onClick={() => window.location.reload()}
                >
                  Muat ulang
                </Button>
              </div>
            )}

            <div className="mb-2 flex w-full max-w-full flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCoachOpen(true)}
                disabled={locked}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/25 bg-brand-teal/10 px-3 py-1.5 text-[10px] font-semibold text-brand-navy transition-colors hover:bg-brand-teal/15 disabled:opacity-50"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Tanya Coach AI
              </button>
              <span className="hidden text-[10px] text-slate-400 sm:inline">
                Saran cepat, bukan jawaban otomatis
              </span>
            </div>

            <form onSubmit={submitMessage} className="relative">
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
                  locked
                    ? "Sesi sedang dievaluasi…"
                    : "Ketik respons negosiasi Anda di sini… (Tekan Enter untuk kirim)"
                }
                disabled={locked}
                maxLength={MAX_CHARS}
                className="min-h-[56px] resize-none rounded-2xl border-slate-200 bg-white py-3.5 pl-4 pr-28 text-sm leading-relaxed shadow-sm transition focus-visible:border-brand-teal/35 focus-visible:ring-brand-teal/25"
              />
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
                {input.length > 0 && (
                  <span
                    className={cn(
                      "hidden text-[10px] tabular-nums sm:inline",
                      input.length > MAX_CHARS - 100 ? "text-rose-600" : "text-slate-400"
                    )}
                  >
                    {input.length}/{MAX_CHARS}
                  </span>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleVoiceInput}
                  disabled={locked || isLoading || isTranscribing}
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-navy disabled:opacity-60",
                    isListening && "bg-brand-teal/10 text-brand-navy"
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
                    <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
                  )}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || locked || isLoading}
                  className="h-9 w-9 shrink-0 rounded-full bg-primary shadow-sm transition duration-200 hover:bg-brand-teal disabled:bg-primary/60"
                  aria-label="Kirim pesan"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px]">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  isLoading || isListening || isTranscribing
                    ? "text-brand-navy"
                    : "text-slate-400"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isLoading || isListening || isTranscribing
                      ? "animate-pulse bg-brand-teal"
                      : "bg-slate-300"
                  )}
                />
                {isTranscribing
                  ? "Mentranskripsi suara..."
                  : isListening
                    ? "Merekam... tekan mikrofon untuk berhenti"
                    : isLoading
                      ? "AI sedang mengetik…"
                      : "AI siap menerima respons Anda"}
              </span>
              <span className="hidden text-slate-400 sm:inline">
                Shift + Enter untuk baris baru
              </span>
            </div>
          </div>

          {isEvaluating && !autoOutcome && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 p-6">
              <div className="max-w-sm rounded-2xl border border-border bg-white p-6 text-center shadow-lift">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
                <p className="mt-4 font-display text-lg font-bold text-ink">
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
          <div className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-background p-4 pb-8 shadow-2xl">
            <div className="mx-auto h-1 w-10 rounded-full bg-border" />
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Detail Skenario
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <ScenarioPanel
                product={product}
                partnerType={partnerType}
                difficulty={difficulty}
              />
            </div>
          </div>
        </div>
      )}

      {/* Coach dialog */}
      <Dialog open={coachOpen} onOpenChange={setCoachOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-brand-teal/10 text-brand-navy">
              <Lightbulb className="h-5 w-5" />
            </div>
            <DialogTitle>Tanya Coach AI</DialogTitle>
            <DialogDescription>
              Gunakan saran ini sebagai pemicu berpikir. Sesuaikan dengan harga,
              volume, dan syarat yang sedang dinegosiasikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            {coachSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.title}
                className="w-full max-w-full overflow-hidden break-words rounded-xl border border-brand-teal/25 bg-brand-teal/10 p-3.5"
              >
                <p className="text-xs font-bold text-brand-navy">
                  {index + 1}. {suggestion.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-brand-navy/75">
                  {suggestion.body}
                </p>
                <p className="mt-2 rounded-lg border border-brand-teal/25 bg-white/80 p-2.5 text-[11px] italic leading-relaxed text-slate-600">
                  “{suggestion.example}”
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 border-brand-teal/35 bg-white text-[10px] text-brand-navy hover:bg-brand-teal/10"
                  onClick={() => applyCoachSuggestion(suggestion.example)}
                >
                  Masukkan ke chat
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCoachOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End session dialog */}
      <Dialog open={endOpen} onOpenChange={setEndOpen}>
        <DialogContent>
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

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-500">
            <p className="font-semibold text-ink">Ringkasan sesi</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between gap-3">
                <span>Produk</span>
                <span className="truncate font-medium text-ink">{product.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Mitra</span>
                <span className="font-medium text-ink">
                  {partner.shortLabel}, {diff.label}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Pesan Anda</span>
                <span className="font-medium text-ink">
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

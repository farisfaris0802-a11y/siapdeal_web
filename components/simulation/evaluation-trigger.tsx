"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function EvaluationTrigger({
  sessionId,
  disabled,
}: {
  sessionId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, outcome: "manual" }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Evaluasi gagal dijalankan.");
      }

      toast.success("Evaluasi selesai.");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Evaluasi gagal dijalankan.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft sm:p-8">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-foreground">
          Evaluasi belum tersedia
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sesi sudah berakhir, tetapi penilaian AI belum tersimpan. Jalankan
          evaluasi untuk menilai transkrip dengan rubrik 5 aspek.
        </p>

        {error && (
          <Alert variant="destructive" className="mt-4 text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={runEvaluation} disabled={loading || disabled}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menganalisis transkrip…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Jalankan evaluasi AI
              </>
            )}
          </Button>
          {error && (
            <Button variant="outline" onClick={runEvaluation} disabled={loading}>
              <RotateCcw className="h-4 w-4" />
              Coba lagi
            </Button>
          )}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Proses biasanya memakan waktu 10 sampai 20 detik.
        </p>
      </div>
    </div>
  );
}

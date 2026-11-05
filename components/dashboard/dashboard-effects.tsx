"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SOUND_KEY = "siapdeal:dashboard-sound";

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function DashboardSoundToggle({
  className,
}: {
  className?: string;
}) {
  const [enabled, setEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SOUND_KEY);
    if (stored === "off") setEnabled(false);
  }, []);

  const playChime = useCallback(() => {
    if (typeof window === "undefined") return;

    const AudioCtor =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioCtor) return;

    let context: AudioContext;
    try {
      context = audioContextRef.current ?? new AudioCtor();
    } catch {
      return;
    }
    audioContextRef.current = context;

    const play = () => {
      const now = context.currentTime;
      const notes = [659.25, 987.77];

      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + index * 0.09;
        const duration = 0.32;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.018, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      });
    };

    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => {});
    } else {
      play();
    }
  }, []);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!enabled || playedRef.current) return;

    const onFirstInteraction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-sound-toggle]")) return;

      playedRef.current = true;
      playChime();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };

    window.addEventListener("pointerdown", onFirstInteraction, {
      passive: true,
    });
    window.addEventListener("keydown", onFirstInteraction);

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, [enabled, playChime]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");

    if (next) {
      playedRef.current = true;
      playChime();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className={cn(
        "h-10 shrink-0 gap-1.5 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      onClick={toggle}
      aria-label={enabled ? "Matikan suara dashboard" : "Aktifkan suara dashboard"}
      aria-pressed={enabled}
      title={enabled ? "Suara dashboard aktif" : "Suara dashboard nonaktif"}
      data-sound-toggle
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      <span className="hidden lg:inline">Suara</span>
    </Button>
  );
}

"use client";

import { Languages } from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  className,
  inverted = false,
  compact = false,
}: {
  className?: string;
  inverted?: boolean;
  compact?: boolean;
}) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border p-0.5",
        inverted
          ? "border-white/15 bg-white/5"
          : "border-border bg-card",
        className
      )}
      aria-label="Pilih bahasa / Choose language"
    >
      {!compact && (
        <Languages
          className={cn(
            "ml-1.5 h-3.5 w-3.5",
            inverted ? "text-white/45" : "text-muted-foreground"
          )}
        />
      )}
      {(["id", "en"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          aria-pressed={language === value}
          className={cn(
            "rounded-full px-2 py-1 text-[10px] font-bold transition-colors",
            language === value
              ? inverted
                ? "bg-white text-ink"
                : "bg-primary text-primary-foreground"
              : inverted
                ? "text-white/55 hover:text-white"
                : "text-muted-foreground hover:text-foreground"
          )}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

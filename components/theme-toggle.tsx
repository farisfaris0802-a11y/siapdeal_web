"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  inverted = false,
  label = true,
}: {
  className?: string;
  inverted?: boolean;
  label?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);

    try {
      localStorage.setItem("siapdeal:theme", next ? "dark" : "light");
    } catch {
      // Penyimpanan bisa diblokir di mode privat.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-colors",
        inverted
          ? "text-white/60 hover:bg-white/10 hover:text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {label && (
        <span className="hidden sm:inline">
          {mounted && isDark ? "Terang" : "Gelap"}
        </span>
      )}
    </button>
  );
}

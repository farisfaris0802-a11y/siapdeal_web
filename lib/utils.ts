import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | string | null | undefined) {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric === null || numeric === undefined || Number.isNaN(numeric)) {
    return "Rp0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatCompactRupiah(value: number) {
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)} jt`;
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
}

export function formatDate(value: string | Date, withTime = false) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatRelative(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(date);
}

export function initials(name: string | null | undefined) {
  if (!name) return "NS";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function scoreTone(score: number) {
  if (score >= 80)
    return {
      label: "Sangat baik",
      color: "text-brand-navy",
      bg: "bg-brand-teal/15",
      stroke: "hsl(var(--brand-teal))",
    };
  if (score >= 60)
    return {
      label: "Cukup baik",
      color: "text-brand-navy-soft",
      bg: "bg-brand-navy/10",
      stroke: "hsl(var(--brand-navy-soft))",
    };
  return {
    label: "Perlu latihan",
    color: "text-rose-700",
    bg: "bg-rose-100",
    stroke: "hsl(var(--destructive))",
  };
}

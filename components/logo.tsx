import Link from "next/link";

import { cn } from "@/lib/utils";

const DEFAULT_TAGLINE = "B2B Negotiation Simulator";

const HANDSHAKE_PATH =
  "M11 6h3l3.29-3.3a1 1 0 0 1 1.42 0l2.58 2.59a1 1 0 0 1 0 1.41L19 9h-8v2a1 1 0 0 1-1 1 1 1 0 0 1-1-1V8a2 2 0 0 1 2-2m-6 5v4l-2.29 2.29a1 1 0 0 0 0 1.41l2.58 2.59a1 1 0 0 0 1.42 0L11 17h4a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1v-1h-7v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9Z";

function Handshake({
  className,
  gradientId = "siapdeal-handshake-light",
}: {
  className?: string;
  gradientId?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="2"
          y1="5"
          x2="22"
          y2="19"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(var(--brand-navy))" />
          <stop offset="0.55" stopColor="hsl(var(--brand-navy-soft))" />
          <stop offset="1" stopColor="hsl(var(--brand-teal))" />
        </linearGradient>
      </defs>
      <path d={HANDSHAKE_PATH} fill={`url(#${gradientId})`} />
    </svg>
  );
}

function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-card p-1.5 shadow-sm transition-transform duration-300 group-hover:-rotate-2 motion-reduce:transition-none">
        <Handshake gradientId="siapdeal-handshake-compact" className="h-6 w-6" />
      </span>
    );
  }

  return (
    <Handshake
      className={cn(
        "h-11 w-11 shrink-0 transition-transform duration-300 group-hover:-rotate-2 motion-reduce:transition-none",
        className
      )}
    />
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
  tagline,
  showTagline = true,
  compact = false,
  inverted = false,
  wordmarkClassName,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  tagline?: string;
  showTagline?: boolean;
  compact?: boolean;
  inverted?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-3", className)}
      aria-label="SiapDeal, B2B Negotiation Simulator"
    >
      {inverted && !compact ? (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background p-1.5 shadow-sm">
          <Handshake gradientId="siapdeal-handshake-inverted" className="h-8 w-8" />
        </span>
      ) : (
        <BrandMark compact={compact} />
      )}

      {showWordmark && (
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "font-sans text-[1.35rem] font-semibold leading-none",
              wordmarkClassName
            )}
          >
            <span className={inverted ? "text-primary-foreground" : "text-brand-navy"}>
              SIAP
            </span>
            <span className="text-brand-teal">DEAL</span>
          </span>
          {showTagline && (
            <span
              className={cn(
                "mt-1 truncate text-[9px] font-medium tracking-normal",
                inverted ? "text-primary-foreground/45" : "text-brand-gray"
              )}
            >
              {tagline ?? DEFAULT_TAGLINE}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

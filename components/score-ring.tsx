import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 148,
  strokeWidth = 10,
  label,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80
      ? "hsl(var(--brand-teal))"
      : clamped >= 60
        ? "hsl(var(--brand-navy-soft))"
        : "hsl(var(--destructive))";

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold leading-none tracking-tight"
          style={{ fontSize: size * 0.29, color }}
        >
          {Math.round(clamped)}
        </span>
        <span
          className="mt-1 font-semibold tracking-normal text-muted-foreground"
          style={{ fontSize: Math.max(9, size * 0.068) }}
        >
          {label ?? "dari 100"}
        </span>
      </div>
    </div>
  );
}


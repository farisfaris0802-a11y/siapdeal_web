import { formatDate } from "@/lib/utils";

interface Point {
  score: number;
  date: string;
  label?: string;
}

export function ScoreChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Grafik muncul setelah sesi pertama selesai dinilai.
        </p>
      </div>
    );
  }

  const width = 680;
  const height = 240;
  const padX = 34;
  const padTop = 26;
  const padBottom = 36;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padTop - padBottom;

  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? padX + plotWidth / 2
        : padX + (index / (data.length - 1)) * plotWidth;
    const y = padTop + plotHeight - (Math.max(0, Math.min(100, point.score)) / 100) * plotHeight;
    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${padTop + plotHeight} L${points[0].x},${padTop + plotHeight} Z`;

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Grafik perkembangan skor evaluasi"
      >
        <defs>
          <linearGradient id="score-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand-teal))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(var(--brand-teal))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((value) => {
          const y = padTop + plotHeight - (value / 100) * plotHeight;
          return (
            <g key={value}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeDasharray={value === 0 ? undefined : "3 5"}
                strokeWidth="1"
              />
              <text
                x={padX - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {value}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#score-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--brand-teal))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={`${point.date}-${index}`}>
            <circle cx={point.x} cy={point.y} r="9" fill="hsl(var(--brand-teal))" opacity="0.12" />
            <circle
              cx={point.x}
              cy={point.y}
              r="4.5"
              fill="#FFFFFF"
              stroke="hsl(var(--brand-teal))"
              strokeWidth="2.5"
            >
              <title>{`Skor ${Math.round(point.score)}, ${formatDate(point.date)}`}</title>
            </circle>
            <text
              x={point.x}
              y={point.y - 13}
              textAnchor="middle"
              className="fill-ink"
              fontSize="10"
              fontWeight="700"
            >
              {Math.round(point.score)}
            </text>
            {data.length <= 8 && (
              <text
                x={point.x}
                y={height - 12}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="9.5"
              >
                {formatDate(point.date)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

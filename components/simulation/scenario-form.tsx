"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Hotel,
  Info,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  Sparkles,
  Store,
  Target,
  Wand2,
  Waves,
} from "lucide-react";

import { createLocalSession } from "@/lib/local-store";
import {
  DIFFICULTY_META,
  PARTNER_META,
  PARTNER_TYPES,
} from "@/lib/ai/personas";
import { CATEGORY_LABEL, PRODUCT_CATEGORIES, SAMPLE_PRODUCTS } from "@/lib/catalog";
import type { Difficulty, PartnerType, ProductCategory } from "@/lib/types";
import { cn, formatRupiah } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const partnerOptions: {
  value: PartnerType;
  icon: typeof Store;
  tone: string;
}[] = [
  { value: "hotel_resort_bali", icon: Hotel, tone: "bg-brand-teal/15 text-brand-navy" },
  { value: "souvenir_retail", icon: Store, tone: "bg-brand-teal/15 text-brand-navy" },
  { value: "beach_club_cafe", icon: Waves, tone: "bg-brand-navy/5 text-brand-navy-soft" },
];

const difficultyOptions: Difficulty[] = ["easy", "medium", "hard"];

function SubmitButton({ pending = false }: { pending?: boolean }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Menyiapkan pembeli virtual...
        </>
      ) : (
        <>
          Mulai simulasi
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

function formatDigits(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export function ScenarioForm({
  defaults,
  demo = false,
}: {
  defaults: {
    name?: string;
    price?: string;
    usp?: string;
    partner?: string;
    difficulty?: string;
    category?: string;
  };
  demo?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialPartner = PARTNER_TYPES.includes(defaults.partner as PartnerType)
    ? (defaults.partner as PartnerType)
    : "hotel_resort_bali";

  const initialDifficulty = (["easy", "medium", "hard"] as Difficulty[]).includes(
    defaults.difficulty as Difficulty
  )
    ? (defaults.difficulty as Difficulty)
    : "medium";

  const initialCategory = PRODUCT_CATEGORIES.some(
    (category) => category.value === defaults.category
  )
    ? (defaults.category as ProductCategory)
    : "kopi_minuman";

  const [name, setName] = useState(defaults.name ?? "");
  const [price, setPrice] = useState(() =>
    defaults.price ? formatDigits(defaults.price) : ""
  );
  const [usp, setUsp] = useState(defaults.usp ?? "");
  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [partner, setPartner] = useState<PartnerType>(initialPartner);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);

  const partnerMeta = PARTNER_META[partner];
  const difficultyMeta = DIFFICULTY_META[difficulty];
  const PartnerIcon =
    partnerOptions.find((option) => option.value === partner)?.icon ?? Hotel;
  const priceNumber = Number(price.replace(/\D/g, ""));

  const applySample = (id: string) => {
    const sample = SAMPLE_PRODUCTS.find((item) => item.id === id);
    if (!sample) return;
    setName(sample.name);
    setPrice(formatDigits(String(sample.basePrice)));
    setUsp(sample.usp);
    setCategory(sample.category);
    setPartner(sample.partner);
    setDifficulty(sample.difficulty);
  };

  const priceHelper = useMemo(() => {
    if (!priceNumber) return "Masukkan harga jual per unit tanpa diskon.";
    if (priceNumber < 1000) return "Harga terlihat sangat rendah, pastikan sudah benar.";
    return `Harga dasar ${formatRupiah(priceNumber)} per unit.`;
  }, [priceNumber]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Nama produk harus 2-120 karakter.");
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setError("Harga jual dasar harus berupa angka lebih dari 0.");
      return;
    }
    if (usp.trim().length < 10) {
      setError("Ceritakan keunggulan produk minimal 10 karakter.");
      return;
    }

    setPending(true);
    try {
      const session = createLocalSession({
        product: {
          name: name.trim(),
          base_price: priceNumber,
          usp: usp.trim(),
          category,
        },
        partnerType: partner,
        difficulty,
      });
      router.push(`/simulasi/${session.id}`);
    } catch {
      setPending(false);
      setError("Gagal menyiapkan sesi lokal. Coba lagi.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Skenario belum bisa dimulai</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {demo && (
          <div className="flex items-start gap-3 rounded-2xl border border-brand-teal/25 bg-brand-teal/10 p-4 text-brand-navy">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-teal/15">
              <Sparkles className="h-4 w-4 text-brand-navy" />
            </span>
            <div className="text-xs leading-relaxed">
              <p className="text-sm font-bold">Mode Demo aktif, skenario contoh sudah terisi</p>
              <p className="mt-0.5 text-brand-navy/70">
                Anda bisa langsung menekan <strong>Mulai simulasi</strong>, atau
                ubah produk, mitra, dan level sesuai skenario yang ingin diuji.
              </p>
            </div>
          </div>
        )}

        {/* Produk */}
        <Card>
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-[18px] w-[18px]" />
              </span>
              <div>
                <CardTitle>1. Data produk</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Informasi ini menjadi dasar pembeli virtual menawar dan
                  menilai penawaran Anda.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="rounded-2xl border border-dashed border-primary/25 bg-sand-50/80 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
                <Wand2 className="h-3.5 w-3.5 text-primary" />
                Isi cepat dengan produk UMKM Bali
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {SAMPLE_PRODUCTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => applySample(sample.id)}
                    className="rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                    title={sample.tagline}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama produk</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Kopi Arabika Kintamani 250 gr"
                maxLength={120}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Gunakan nama yang akan Anda sebut saat presentasi ke mitra.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_price">Harga jual dasar (per unit)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="base_price"
                  name="base_price"
                  inputMode="numeric"
                  value={price}
                  onChange={(event) => setPrice(formatDigits(event.target.value))}
                  placeholder="25.000"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{priceHelper}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori produk</Label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ProductCategory)
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {PRODUCT_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Membantu AI menyesuaikan keberatan dan benchmark margin.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usp">Keunggulan / USP produk</Label>
              <Textarea
                id="usp"
                name="usp"
                value={usp}
                onChange={(event) => setUsp(event.target.value)}
                placeholder="Contoh: Biji arabika single origin Kintamani, roasted fresh setiap minggu, sudah bersertifikat halal & PIRT, tahan 6 bulan dalam kemasan valve."
                className="min-h-[120px]"
                maxLength={1200}
                required
              />
              <div className="flex items-start justify-between gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-start gap-1.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Semakin konkret bukti dan manfaatnya, semakin tajam penilaian
                  value proposition Anda.
                </span>
                <span className="shrink-0 tabular-nums">{usp.length}/1200</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mitra */}
        <Card>
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-[18px] w-[18px]" />
              </span>
              <div>
                <CardTitle>2. Jenis mitra</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilih tipe pembeli yang ingin Anda hadapi.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {partnerOptions.map((option) => {
                const meta = PARTNER_META[option.value];
                const selected = partner === option.value;
                const Icon = option.icon;

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "relative cursor-pointer rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-ring/40",
                      selected
                        ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary"
                        : "border-border bg-white hover:border-primary/30 hover:bg-sand-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="partner_type"
                      value={option.value}
                      checked={selected}
                      onChange={() => setPartner(option.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <span className={cn("grid h-9 w-9 place-items-center rounded-xl", option.tone)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={cn(
                          "grid h-5 w-5 place-items-center rounded-full border transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-white"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-snug text-ink">{meta.label}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {meta.location}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {meta.description}
                    </p>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border/70 bg-sand-50 px-3.5 py-2.5 text-xs text-muted-foreground">
              <PartnerIcon className="h-4 w-4 text-primary" />
              <span>
                Anda akan bernegosiasi dengan{" "}
                <span className="font-semibold text-ink">{partnerMeta.buyerName}</span>
                {", "}
                {partnerMeta.buyerRole} di {partnerMeta.company}.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Kesulitan */}
        <Card>
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-[18px] w-[18px]" />
              </span>
              <div>
                <CardTitle>3. Tingkat kesulitan</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Menentukan seberapa keras pembeli menekan harga dan syarat.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {difficultyOptions.map((value) => {
                const meta = DIFFICULTY_META[value];
                const selected = difficulty === value;
                const tones: Record<Difficulty, string> = {
                  easy: "bg-brand-teal",
                  medium: "bg-brand-navy-soft",
                  hard: "bg-rose-500",
                };

                return (
                  <label
                    key={value}
                    className={cn(
                      "cursor-pointer rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-ring/40",
                      selected
                        ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary"
                        : "border-border bg-white hover:border-primary/30 hover:bg-sand-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={value}
                      checked={selected}
                      onChange={() => setDifficulty(value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-ink">
                        <span className={cn("h-2 w-2 rounded-full", tones[value])} />
                        {meta.label}
                      </span>
                      {selected ? (
                        <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-border" />
                      )}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {meta.description}
                    </p>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 text-primary" />
            Data hanya digunakan untuk sesi latihan Anda.
          </div>
          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <SubmitButton pending={pending} />
          </div>
        </div>
      </form>

      {/* Preview */}
      <div className="space-y-4 xl:sticky xl:top-8 xl:self-start">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-primary-foreground shadow-sm">
          <div className="pointer-events-none absolute inset-0 grain opacity-20" />

          <div className="relative flex items-center justify-between">
            <p className="text-[10px] font-bold text-primary-foreground/45">
              Pratinjau skenario
            </p>
            <Badge className="border-primary-foreground/10 bg-primary-foreground/10 text-[10px] text-primary-foreground">
              Live
            </Badge>
          </div>

          <div className="relative mt-5 flex items-center gap-3 border-b border-primary-foreground/10 pb-5">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-foreground/10 text-2xl ring-1 ring-white/10">
              <PartnerIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold leading-tight">
                {partnerMeta.buyerName}
              </p>
              <p className="truncate text-[11px] text-primary-foreground/55">
                {partnerMeta.buyerRole}, {partnerMeta.company}
              </p>
            </div>
          </div>

          <div className="relative mt-5 space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-[10px] text-primary-foreground/40">Produk</p>
                <p className="truncate font-semibold">{name.trim() || "Belum diisi"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-[10px] text-primary-foreground/40">Harga dasar</p>
                <p className="font-semibold">
                  {priceNumber ? `${formatRupiah(priceNumber)} / unit` : "Belum diisi"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-[10px] text-primary-foreground/40">Kategori</p>
                <p className="font-semibold">{CATEGORY_LABEL[category]}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <p className="text-[10px] text-primary-foreground/40">Level</p>
                <p className="font-semibold">
                  {partnerMeta.shortLabel}, {difficultyMeta.label}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-5 rounded-2xl border border-primary-foreground/10 bg-white/[0.06] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-accent">
              <MessageSquare className="h-3.5 w-3.5" />
              Yang akan terjadi
            </p>
            <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-primary-foreground/65">
              <li className="flex gap-2">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                Pembeli membuka percakapan dan meminta penawaran Anda.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                Harga, margin, TOP, dan konsinyasi akan ditekan sesuai level.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                Sesi berakhir otomatis atau Anda bisa mengakhirinya manual.
              </li>
            </ul>
          </div>

          <div className="relative mt-5 flex items-center gap-2 text-[10px] text-primary-foreground/45">
            <Clock className="h-3.5 w-3.5" />
            Estimasi 3 sampai 7 menit, 5 aspek dinilai di akhir sesi
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white p-4 text-xs leading-relaxed text-muted-foreground shadow-soft">
          <p className="font-semibold text-ink">Tips sebelum mulai</p>
          <ul className="mt-2 space-y-1.5">
            <li>• Siapkan batas harga terendah Anda, jangan hanya mengandalkan harga dasar.</li>
            <li>• Pikirkan minimal dua alasan mengapa produk Anda layak mendapat harga tersebut.</li>
            <li>• Semakin jujur Anda berlatih, semakin berguna evaluasinya.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

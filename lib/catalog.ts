import type { ProductCategory } from "@/lib/types";

export const PRODUCT_CATEGORIES: {
  value: ProductCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "kopi_minuman", label: "Kopi & Minuman", emoji: "☕" },
  { value: "makanan_olahan", label: "Makanan Olahan", emoji: "🥨" },
  { value: "spa_wellness", label: "Spa & Wellness", emoji: "🌺" },
  { value: "fashion_kriya", label: "Fashion & Kriya", emoji: "🧵" },
  { value: "lainnya", label: "Lainnya", emoji: "📦" },
];

export const CATEGORY_LABEL: Record<ProductCategory, string> =
  Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [category.value, category.label])
  ) as Record<ProductCategory, string>;

export interface SampleProduct {
  id: string;
  name: string;
  basePrice: number;
  usp: string;
  category: ProductCategory;
  partner: "hotel_resort_bali" | "souvenir_retail" | "beach_club_cafe";
  difficulty: "easy" | "medium" | "hard";
  tagline: string;
}

/**
 * Skenario contoh yang sudah terisi. Dipakai untuk mode juri (?demo=1)
 * agar evaluator bisa mencoba alur penuh dalam hitungan detik.
 */
export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: "kopi-kintamani",
    name: "Kopi Arabika Kintamani 250 gr",
    basePrice: 85000,
    usp: "Single origin Kintamani 1.400 mdpl, roasted fresh setiap Selasa, notes jeruk & cokelat, sudah bersertifikat halal dan PIRT, kemasan valve tahan 6 bulan. Cukup 18 gr per cup sehingga HPP per porsi hanya sekitar Rp6.100.",
    category: "kopi_minuman",
    partner: "hotel_resort_bali",
    difficulty: "medium",
    tagline: "Cocok untuk welcome amenity & kopi sarapan hotel",
  },
  {
    id: "sabun-frangipani",
    name: "Sabun Spa Frangipani 100 gr",
    basePrice: 35000,
    usp: "Handmade cold-process dengan minyak kelapa Bali dan ekstrak frangipani asli, pH 5,5, tanpa SLS dan paraben. Cocok untuk turis yang mencari produk lokal premium, kemasan plastik daur ulang, dan bisa private label mulai 100 pcs.",
    category: "spa_wellness",
    partner: "souvenir_retail",
    difficulty: "hard",
    tagline: "Produk oleh-oleh premium dengan cerita lokal",
  },
  {
    id: "sambal-matah",
    name: "Sambal Matah Premium 200 gr",
    basePrice: 28000,
    usp: "Resep Bali asli dengan serai, kecombrang, dan minyak kelapa, tanpa pengawet, tahan 3 bulan di chiller. Sudah PIRT dan halal, konsisten pedasnya, kemasan food-grade 200 gr. Cocok untuk menu ayam geprek, seafood, dan rice bowl.",
    category: "makanan_olahan",
    partner: "beach_club_cafe",
    difficulty: "medium",
    tagline: "Menu pendamping dengan food cost terkontrol",
  },
];

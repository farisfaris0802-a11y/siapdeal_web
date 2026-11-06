import type { Difficulty, PartnerType, RubricKey } from "@/lib/types";

export const PARTNER_TYPES: PartnerType[] = [
  "hotel_resort_bali",
  "souvenir_retail",
  "beach_club_cafe",
];

export const PARTNER_META: Record<
  PartnerType,
  {
    label: string;
    shortLabel: string;
    location: string;
    description: string;
    buyerName: string;
    buyerRole: string;
    company: string;
    context: string;
    playbook: string[];
    accent: string;
    emoji: string;
  }
> = {
  hotel_resort_bali: {
    label: "F&B Director Hotel Resort Bali",
    shortLabel: "Hotel Resort",
    location: "Nusa Dua / Kuta",
    description:
      "Volume besar dan kontrak panjang, tetapi standar kualitas, sertifikasi, serta TOP 30–60 hari sangat ketat.",
    buyerName: "Ibu Ayu Prameswari",
    buyerRole: "F&B Director",
    company: "Amrita Resort & Spa",
    context:
      "Resort bintang lima dengan 210 kamar, tiga restoran, dan layanan banquet di Nusa Dua. Tamu didominasi wisatawan Australia, Eropa, dan korporat. Pengadaan dilakukan terpusat, diaudit setiap kuartal, dan sangat menjaga konsistensi rasa serta keamanan pangan. High season Juli–September dan Desember menjadi periode paling sibuk.",
    playbook: [
      "Minta harga distributor untuk volume 150–300 pcs per bulan.",
      "Tuntut TOP 30–60 hari setelah invoice diterima, bukan pembayaran di muka.",
      "Minta sampel gratis dan uji coba dua minggu untuk welcome amenity atau minibar.",
      "Tanyakan sertifikat halal, PIRT/BPOM, HACCP, masa simpan, dan konsistensi pasokan.",
      "Minta pengiriman terjadwal ke Nusa Dua minimal dua kali seminggu.",
      "Tawarkan kontrak 6–12 bulan hanya jika harga, kualitas, dan termin cocok.",
    ],
    accent: "amber",
    emoji: "🏨",
  },
  souvenir_retail: {
    label: "Manager Pusat Oleh-Oleh & Ritel Bali",
    shortLabel: "Oleh-Oleh",
    location: "Kuta / Denpasar",
    description:
      "Paling sensitif pada margin dan titip jual. Menuntut harga distributor, skema sale-or-return, dan dukungan display.",
    buyerName: "Pak Gede Wirayuda",
    buyerRole: "Purchasing Manager",
    company: "Bali Heritage Souvenir",
    context:
      "Jaringan pusat oleh-oleh dengan 12 gerai di Kuta, Seminyak, dan Denpasar. Sekitar 70% pembeli adalah turis yang mencari produk khas Bali dengan kemasan menarik. Perputaran cepat pada high season, tetapi ruang rak terbatas dan produk yang tidak laku harus diputar ke gerai lain atau diretur.",
    playbook: [
      "Tuntut harga distributor dan margin ritel 35–45% dari harga jual konsumen.",
      "Minta titip jual 50–70% untuk SKU baru; pembayaran setelah produk terjual.",
      "Minta sale-or-return, retur produk mendekati kedaluwarsa, dan dukungan barcode.",
      "Minta slotting atau listing fee, display gondola, dan promo high season.",
      "Tanyakan kemasan oleh-oleh, label bilingual, ketahanan produk, dan legalitas.",
      "Bandingkan dengan supplier lokal atau impor yang lebih murah untuk menekan harga.",
    ],
    accent: "emerald",
    emoji: "🛍️",
  },
  beach_club_cafe: {
    label: "Owner Kafe / Restoran Modern",
    shortLabel: "Beach Club",
    location: "Canggu / Seminyak",
    description:
      "Trend-driven dan sadar food cost. MOQ kecil, keputusan cepat, tetapi margin dan konsistensi rasa tidak bisa ditawar.",
    buyerName: "Ibu Kadek Alina",
    buyerRole: "Owner & F&B Lead",
    company: "Sundara Beach House",
    context:
      "Beach club dan restoran modern di Canggu dengan sunset crowd, live DJ, dan rotasi menu musiman. Keputusan pembelian cepat, tetapi food cost dijaga 30–35%, porsi harus konsisten, dan tampilan menu harus layak masuk konten Instagram. Arus kas harian membuat pembayaran panjang sulit diterima.",
    playbook: [
      "Tuntut food cost 30–35% dan margin kotor 65–70%.",
      "Minta harga khusus, MOQ kecil 24–48 pcs, dan pengiriman mingguan.",
      "Tawarkan eksklusivitas menu atau co-branding sebagai imbalan harga lebih rendah.",
      "Tekan pembayaran 7–14 hari; konsinyasi hanya untuk uji menu terbatas.",
      "Tanyakan konsistensi rasa, kemasan display, dan kesiapan pasokan saat high season.",
      "Minta sampel gratis dan menu trial untuk tim dapur sebelum komitmen.",
    ],
    accent: "sky",
    emoji: "🌅",
  },
};

export const DIFFICULTY_META: Record<
  Difficulty,
  {
    label: string;
    description: string;
    traits: string;
    ceilingRatio: number;
    openingRatio: number;
    maxTurns: number;
  }
> = {
  easy: {
    label: "Mudah",
    description: "Pembeli hangat dan terbuka. Cocok untuk latihan pertama.",
    traits:
      "Ramah dan hangat khas Bali. Mengajukan satu keberatan per giliran, menghargai alasan yang masuk akal, dan bersedia membayar TOP 30 hari tanpa menuntut konsinyasi.",
    ceilingRatio: 0.9,
    openingRatio: 0.76,
    maxTurns: 12,
  },
  medium: {
    label: "Menengah",
    description: "Pembeli selektif. Menuntut bukti nilai, margin, dan termin yang wajar.",
    traits:
      "Profesional dan selektif. Mengajukan dua keberatan sekaligus, membandingkan dengan supplier lain, meminta margin 30–35%, TOP 30–45 hari, dan konsinyasi 10–20%.",
    ceilingRatio: 0.8,
    openingRatio: 0.6,
    maxTurns: 16,
  },
  hard: {
    label: "Sulit",
    description: "Pembeli keras. Menekan harga, TOP panjang, dan titip jual agresif.",
    traits:
      "Sangat keras dan transaksional. Menekan harga 25–35% di bawah penawaran, menuntut TOP 60 hari, titip jual 30–50%, biaya listing, dan siap berjalan ke supplier lain jika tidak ada konsesi.",
    ceilingRatio: 0.7,
    openingRatio: 0.48,
    maxTurns: 20,
  },
};

export const RUBRIC_ASPECTS: {
  key: RubricKey;
  label: string;
  labelEn: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    key: "kejelasan_penawaran",
    label: "Kejelasan Penawaran",
    labelEn: "Offer Clarity",
    shortLabel: "Kejelasan",
    description:
      "Apakah harga, isi paket, volume, PPN, dan syarat disampaikan secara spesifik dan mudah dipahami?",
  },
  {
    key: "value_proposition",
    label: "Penyampaian Nilai Produk",
    labelEn: "Value Proposition",
    shortLabel: "Value",
    description:
      "Apakah keunggulan produk diterjemahkan menjadi manfaat bisnis konkret bagi mitra Bali?",
  },
  {
    key: "handling_objections",
    label: "Cara Menjawab Keberatan",
    labelEn: "Objection Handling",
    shortLabel: "Objeksi",
    description:
      "Apakah keberatan soal margin, titip jual, TOP, dan kualitas dijawab tenang serta berbasis bukti?",
  },
  {
    key: "fleksibilitas_margin",
    label: "Fleksibilitas Margin & Batas Toleransi",
    labelEn: "Margin Flexibility",
    shortLabel: "Margin",
    description:
      "Apakah konsesi harga diberikan terukur, ditukar dengan syarat lain, dan tetap menjaga batas margin?",
  },
  {
    key: "closing",
    label: "Ketegasan Menutup Kesepakatan",
    labelEn: "Closing Assertion",
    shortLabel: "Closing",
    description:
      "Apakah percakapan diarahkan ke kesepakatan konkret: harga final, volume, TOP, dan langkah lanjutan?",
  },
];

export const RUBRIC_LABEL_BY_KEY = Object.fromEntries(
  RUBRIC_ASPECTS.map((aspect) => [aspect.key, aspect.label])
) as Record<RubricKey, string>;

export function getPartnerMeta(type: PartnerType) {
  return PARTNER_META[type] ?? PARTNER_META.hotel_resort_bali;
}

export function getDifficultyMeta(difficulty: Difficulty) {
  return DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.medium;
}

export const OPENING_MESSAGE_TEMPLATES: Record<PartnerType, string> = {
  hotel_resort_bali:
    "Selamat pagi, saya {buyer}, F&B Director {company}. Kami sedang mengevaluasi supplier untuk welcome amenity dan minibar. Boleh Bapak/Ibu jelaskan penawaran {product} — harga per unit, MOQ, sertifikasi, dan syarat pembayarannya?",
  souvenir_retail:
    "Siang, saya {buyer} dari {company}. Kami punya 12 gerai di area Kuta–Denpasar dan sedang mencari produk baru untuk rak oleh-oleh. Bisa kirim penawaran {product}: harga distributor, ketentuan titip jual, dan dukungan promonya?",
  beach_club_cafe:
    "Hai, saya {buyer}, owner {company} di Canggu. Kami sedang uji beberapa produk untuk menu sunset. Ceritakan {product} Anda: harga, MOQ, dan kenapa cocok dengan konsep beach club kami?",
};

export const OPENING_MESSAGE_TEMPLATES_EN: Record<PartnerType, string> = {
  hotel_resort_bali:
    "Good morning, I'm {buyer}, the F&B Director at {company}. We're evaluating suppliers for welcome amenities and the minibar. Could you walk me through your {product} offer — unit price, MOQ, certifications, and payment terms?",
  souvenir_retail:
    "Good afternoon, I'm {buyer} from {company}. We operate 12 stores around Kuta–Denpasar and are looking for new products for our souvenir shelves. Could you send your {product} offer: distributor price, consignment terms, and promotional support?",
  beach_club_cafe:
    "Hi, I'm {buyer}, the owner of {company} in Canggu. We're testing a few products for our sunset menu. Tell me about your {product}: pricing, MOQ, and why it fits our beach club concept.",
};

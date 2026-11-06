"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Language } from "@/lib/types";

const en: Record<string, string> = {
  // Shell & navigation
  Dashboard: "Dashboard",
  "Simulasi Baru": "New Simulation",
  Latihan: "Practice",
  Riwayat: "History",
  Evaluasi: "Evaluations",
  Keluar: "Sign out",
  Profil: "Profile",
  Bahasa: "Language",
  "Mode demo lokal": "Local demo mode",
  "Online, Free Plan": "Online, Free Plan",
  "Kembali ke dashboard": "Back to dashboard",
  "Buka detail skenario": "Open scenario details",
  Tutup: "Close",
  "Muat ulang": "Reload",
  "Coba lagi": "Try again",

  // Dashboard
  "Meja negosiasi": "Negotiation desk",
  "Latih negosiasi tanpa hambatan login. Semua sesi tersimpan di browser ini.":
    "Practice negotiation without signing in. All sessions are stored in this browser.",
  "Ada sesi yang belum selesai": "You have an unfinished session",
  Lanjutkan: "Continue",
  "Total sesi": "Total sessions",
  "Sesi dinilai": "Sessions evaluated",
  "Rata-rata skor": "Average score",
  "Skor terbaik": "Best score",
  "Belum ada": "No data yet",
  "Sesi latihan Anda": "Your practice sessions",
  "Memuat sesi lokal...": "Loading local sessions...",
  "Belum ada sesi latihan": "No practice sessions yet",
  "Mulai dengan satu produk dan satu jenis mitra. Sesi dan skor akan tersimpan di browser ini tanpa perlu login.":
    "Start with one product and one partner type. Sessions and scores will be stored in this browser without signing in.",
  "Mulai simulasi pertama": "Start your first simulation",
  Berlangsung: "In progress",
  Sepakat: "Deal",
  Selesai: "Completed",
  "Lihat evaluasi": "View evaluation",
  "{count} sesi": "{count} sessions",

  // History / evaluation list
  "Riwayat & evaluasi": "History & evaluations",
  "Jejak latihan Anda": "Your practice trail",
  "Evaluasi negosiasi Anda.": "Your negotiation history.",
  "Semua hasil penilaian 5 aspek dalam satu tempat. Data tersimpan di browser ini tanpa akun email.":
    "Every 5-aspect evaluation in one place. Data is stored in this browser without an email account.",
  "Mulai simulasi": "Start simulation",
  "Riwayat evaluasi": "Evaluation history",
  "Memuat evaluasi lokal...": "Loading local evaluations...",
  "Belum ada evaluasi": "No evaluations yet",
  "Selesaikan satu sesi negosiasi, lalu AI akan menilai transkrip dengan rubrik 5 aspek. Hasilnya akan muncul di sini.":
    "Complete one negotiation session and the AI will evaluate the transcript with a 5-aspect rubric. Results will appear here.",
  Siap: "Ready",
  Cukup: "Fair",
  "Perlu latihan": "Needs practice",
  Semua: "All",
  "Ulasan skor, verdict, dan ringkasan tiap sesi.":
    "Review the score, verdict, and summary of each session.",

  // New simulation page & form
  "Skenario baru": "New scenario",
  "Mode Demo, Bali DigiFest 2026": "Demo Mode, Bali DigiFest 2026",
  "Siapkan lawan negosiasi Anda.": "Set up your negotiation counterpart.",
  "Isi data produk, pilih jenis mitra Bali dan tingkat kesulitan. AI akan memerankan pembeli dengan karakter, batas harga, dan tuntutan komersial yang konsisten.":
    "Fill in your product, choose a Balinese partner type and difficulty. The AI will play a buyer with consistent character, price ceiling, and commercial demands.",
  "Data produk": "Product data",
  "Jenis mitra": "Partner type",
  Kesulitan: "Difficulty",
  "1. Data produk": "1. Product data",
  "Informasi ini menjadi dasar pembeli virtual menawar dan menilai penawaran Anda.":
    "This information is the basis for the virtual buyer's negotiation and evaluation.",
  "Isi cepat dengan produk UMKM Bali": "Quick fill with a Balinese SME product",
  "Nama produk": "Product name",
  "Harga jual dasar (Rp)": "Base selling price (IDR)",
  "Harga jual dasar (per unit)": "Base selling price (per unit)",
  Kategori: "Category",
  "Kategori produk": "Product category",
  "Keunggulan produk (USP)": "Product advantages (USP)",
  "Keunggulan / USP produk": "Product advantages / USP",
  "Pilih tipe pembeli yang ingin Anda hadapi.":
    "Choose the type of buyer you want to face.",
  "Menentukan seberapa keras pembeli menekan harga dan syarat.":
    "Determines how hard the buyer pushes on price and terms.",
  "5 aspek dinilai di akhir sesi.":
    "5 aspects are scored at the end of the session.",
  "Gunakan nama yang akan Anda sebut saat presentasi ke mitra.":
    "Use the name you will mention when presenting to the partner.",
  "Membantu AI menyesuaikan keberatan dan benchmark margin.":
    "Helps AI tailor objections and margin benchmarks.",
  "Semakin konkret bukti dan manfaatnya, semakin tajam penilaian value proposition Anda.":
    "The more concrete the proof and benefits, the sharper your value proposition score.",
  Mudah: "Easy",
  Menengah: "Medium",
  Sulit: "Hard",
  "Pembeli hangat dan terbuka. Cocok untuk latihan pertama.":
    "A warm, open buyer. Good for your first practice.",
  "Pembeli selektif. Menuntut bukti nilai, margin, dan termin yang wajar.":
    "A selective buyer. Expects proof of value, margin, and reasonable terms.",
  "Pembeli keras. Menekan harga, TOP panjang, dan titip jual agresif.":
    "A tough buyer. Presses price, long payment terms, and aggressive consignment.",
  "Volume besar dan kontrak panjang, tetapi standar kualitas, sertifikasi, serta TOP 30–60 hari sangat ketat.":
    "Large volume and long contracts, but strict quality, certification, and 30–60 day payment terms.",
  "Paling sensitif pada margin dan titip jual. Menuntut harga distributor, skema sale-or-return, dan dukungan display.":
    "Most sensitive to margin and consignment. Expects distributor pricing, sale-or-return, and display support.",
  "Trend-driven dan sadar food cost. MOQ kecil, keputusan cepat, tetapi margin dan konsistensi rasa tidak bisa ditawar.":
    "Trend-driven and food-cost aware. Small MOQs and fast decisions, but margin and consistency are non-negotiable.",
  "Hotel Resort": "Hotel Resort",
  "Oleh-Oleh": "Souvenir",
  "Beach Club": "Beach Club",
  "Kopi & Minuman": "Coffee & Drinks",
  "Makanan Olahan": "Processed Food",
  "Spa & Wellness": "Spa & Wellness",
  "Fashion & Kriya": "Fashion & Crafts",
  Lainnya: "Other",
  "F&B Director Hotel Resort Bali": "F&B Director, Bali Resort Hotel",
  "Manager Pusat Oleh-Oleh & Ritel Bali":
    "Souvenir & Retail Manager, Bali",
  "Owner Kafe / Restoran Modern": "Modern Cafe / Restaurant Owner",
  "Anda akan bernegosiasi dengan {buyer}, {role} di {company}.":
    "You will negotiate with {buyer}, {role} at {company}.",
  Tingkat: "Level",
  Pembeli: "Buyer",
  "Panduan untuk level {level}.": "Guidance for {level} level.",
  "Keunggulan klaim": "Claimed advantages",
  "Strategi dan tips negosiasi": "Negotiation strategy and tips",
  "Dinilai di akhir sesi": "Scored at the end of the session",
  "Rubrik tetap dan konsisten antar sesi.":
    "The rubric is fixed and consistent across sessions.",
  "Sesi berakhir otomatis saat sepakat atau buntu.":
    "The session ends automatically on a deal or deadlock.",
  "Gunakan data, nilai produk, dan trade-off, bukan diskon langsung.":
    "Use data, product value, and trade-offs, not instant discounts.",
  "2. Jenis mitra": "2. Partner type",
  "3. Tingkat kesulitan": "3. Difficulty level",
  "Bahasa negosiasi": "Negotiation language",
  "Balasan AI, evaluasi, dan transkripsi suara.":
    "AI replies, evaluation, and voice transcription.",
  "Menyiapkan pembeli virtual...": "Preparing virtual buyer...",
  "Tips sebelum mulai": "Tips before you start",
  "Pratinjau skenario": "Scenario preview",
  Produk: "Product",
  "Harga dasar": "Base price",
  Level: "Level",
  "Yang akan terjadi": "What will happen",
  "Data hanya digunakan untuk sesi latihan Anda.":
    "Data is only used for your practice session.",
  "Mode Demo aktif, skenario contoh sudah terisi":
    "Demo mode is on, the sample scenario is pre-filled",
  "Belum diisi": "Not filled in",
  "Siapkan batas harga terendah Anda, jangan hanya mengandalkan harga dasar.":
    "Prepare your lowest price limit; don't rely only on the base price.",
  "Pikirkan minimal dua alasan mengapa produk Anda layak mendapat harga tersebut.":
    "Think of at least two reasons your product deserves that price.",
  "Semakin jujur Anda berlatih, semakin berguna evaluasinya.":
    "The more honestly you practice, the more useful the evaluation.",
  "Sesi berakhir otomatis atau Anda bisa mengakhirinya manual.":
    "The session ends automatically, or you can end it manually.",
  "Harga, margin, TOP, dan konsinyasi akan ditekan sesuai level.":
    "Price, margin, terms, and consignment will be pushed according to the level.",
  "Pembeli membuka percakapan dan meminta penawaran Anda.":
    "The buyer opens the conversation and asks for your offer.",
  "Estimasi 3 sampai 7 menit, 5 aspek dinilai di akhir sesi":
    "Estimated 3–7 minutes, 5 aspects scored at the end",

  // Chat
  "Akhiri": "End",
  "Sesi latihan · AI berperan sebagai pembeli":
    "Practice session · AI plays the buyer",
  "Tulis respons negosiasi…": "Write your negotiation reply…",
  "Sesi sedang dievaluasi…": "Session is being evaluated…",
  Mulai: "Start",
  "Tanya volume": "Ask volume",
  "Tukar konsesi": "Trade terms",
  "Kunci uji coba": "Lock a trial",
  "Tanya Coach AI": "Ask Coach AI",
  "Saran cepat, bukan jawaban otomatis":
    "Quick prompts, not automatic answers",
  "Detail Skenario": "Scenario details",
  "Selesaikan & Lihat Evaluasi Deal": "Finish & view deal evaluation",
  "Menganalisis transkrip & menyusun skor…":
    "Analyzing the transcript and composing scores…",
  "AI sedang mengetik…": "AI is typing…",
  "AI siap menerima respons Anda": "AI is ready for your reply",
  "Bahasa AI": "AI language",
  "Balasan, evaluasi, dan transkripsi": "Replies, evaluation, and transcription",
  "Lanjutkan negosiasi": "Continue negotiating",
  "Selesaikan & lihat evaluasi": "Finish & view evaluation",
  "Lihat strategi lengkap": "View full strategy",
  "Masukkan ke chat": "Insert into chat",
  Disarankan: "Recommended",
  "Online, siap bernegosiasi": "Online, ready to negotiate",
  Online: "Online",
  "Mitra B2B": "B2B Partner",
  "AI Negotiator": "AI Negotiator",
  "Sesi aktif, {mode}": "Active session, {mode}",
  "Mode Demo": "Demo Mode",
  "Menganalisis transkrip & menyusun skor.":
    "Analyzing the transcript and composing scores.",
  "Saran kontekstual untuk balasan berikutnya.":
    "Contextual prompts for your next reply.",
  "Menyusun evaluasi.": "Composing evaluation.",
  "Selesaikan & lihat evaluasi deal?":
    "Finish & view the deal evaluation?",
  "Percakapan akan ditutup dan AI menilai seluruh transkrip dengan rubrik 5 aspek. Hasilnya langsung tersedia di halaman evaluasi.":
    "The conversation will close and AI will score the whole transcript with a 5-aspect rubric. Results appear on the evaluation page.",
  "AI sedang menilai negosiasi Anda": "AI is evaluating your negotiation",
  "Merekam... tekan mikrofon untuk berhenti":
    "Recording... tap the microphone to stop",
  "Mentranskripsi suara...": "Transcribing audio...",
  "Transkrip dianalisis dengan 5 aspek rubrik. Proses ini biasanya memakan waktu 10 sampai 20 detik.":
    "The transcript is analyzed across 5 rubric aspects. This usually takes 10–20 seconds.",
  "Selesaikan sesi dan lihat evaluasi": "End the session and view the evaluation",
  "Selesaikan &amp; lihat evaluasi deal?": "Finish & view the deal evaluation?",
  "Anda belum mengirim pesan. Kirim minimal satu respons agar AI bisa menilai negosiasi.":
    "You haven't sent a message yet. Send at least one response so AI can evaluate the negotiation.",
  "Selesaikan &amp; Lihat Evaluasi Deal": "Finish & view deal evaluation",
  "Ringkasan sesi": "Session summary",
  Mitra: "Partner",
  "Pesan Anda": "Your messages",
  "{count} pesan": "{count} messages",
  "Buka saran Coach AI": "Open Coach AI prompts",
  "Tutup detail skenario": "Close scenario details",
  "Detail skenario": "Scenario details",
  "Konteks, strategi, dan rubrik penilaian":
    "Context, strategy, and scoring rubric",
  "Sebutkan harga, isi paket, dan syarat secara spesifik sejak awal.":
    "State the price, package contents, and terms specifically from the start.",
  "Hubungkan USP dengan manfaat nyata untuk mitra.":
    "Connect the USP to real benefits for the partner.",
  "Tutup dengan pertanyaan yang meminta komitmen.":
    "Close with a question that asks for commitment.",
  "Jangan langsung menurunkan harga; tanyakan dulu kebutuhan volume.":
    "Don't cut the price immediately; ask about volume requirements first.",
  "Tukar konsesi harga dengan syarat pembayaran atau komitmen volume.":
    "Trade price concessions for payment terms or volume commitments.",
  "Jawab keberatan TOP dengan solusi, bukan penolakan.":
    "Answer payment-term objections with solutions, not refusals.",
  "Jaga batas harga Anda dan jangan panik saat pembeli mengancam mundur.":
    "Protect your price floor and stay calm when the buyer threatens to walk away.",
  "Tawarkan paket alternatif: harga lebih rendah untuk komitmen lebih besar.":
    "Offer an alternative package: a lower price for a bigger commitment.",
  "Tolak konsinyasi penuh dengan alternatif yang tetap menguntungkan.":
    "Reject full consignment with an alternative that still protects your margin.",

  // Results
  "Ringkasan hasil": "Result summary",
  "Siap menghadapi mitra": "Ready to face partners",
  "Pola negosiasi Anda sudah kuat. Pertahankan dan asah detail kecilnya.":
    "Your negotiation pattern is strong. Keep it up and refine the details.",
  "Cukup baik, masih bisa diasah": "Good, but still improvable",
  "Dasar negosiasi sudah ada. Fokus pada aspek dengan skor terendah.":
    "You have the fundamentals. Focus on the lowest-scoring aspects.",
  "Perlu latihan lagi": "Needs more practice",
  "Masih ada celah besar. Ulangi skenario dan terapkan saran di bawah.":
    "There are still big gaps. Retry the scenario and apply the suggestions below.",
  "Kesepakatan tercapai": "Deal reached",
  "Tanpa kesepakatan": "No deal",
  "Diakhiri manual": "Ended manually",
  "Hasil evaluasi transkrip negosiasi {product} dengan {buyer} ({partner}), level {level}.":
    "Evaluation of the negotiation transcript for {product} with {buyer} ({partner}), level {level}.",
  "Cara membaca hasil": "How to read your results",
  Terkuat: "Strongest",
  "Prioritas latihan": "Practice priority",
  "Fokus berikutnya": "Next focus",
  "Kekuatan Anda ada di {strong}, tetapi {weak} masih menahan skor.":
    "Your strength is in {strong}, but {weak} is still holding the score back.",
  "Profil Anda cukup seimbang, sekarang tinggal mempertajam konsistensi.":
    "Your profile is fairly balanced; now it's about sharpening consistency.",
  "Rubrik tetap": "Fixed rubric",
  "Penilaian per aspek": "Score by aspect",
  "Skala 0 sampai 100": "Scale 0 to 100",
  "Kekuatan Anda": "Your strengths",
  "Yang perlu diperbaiki": "What to improve",
  "Saran perbaikan": "Improvement suggestions",
  "Kalimat yang lebih kuat untuk momen yang sama":
    "Stronger phrasing for the same moment",
  "Respons asli Anda": "Your original response",
  "Versi yang lebih kuat": "Stronger version",
  "Mengapa:": "Why:",
  "Lihat transkrip lengkap": "View full transcript",
  "{count} pesan, buka untuk meninjau seluruh percakapan":
    "{count} messages, open to review the whole conversation",
  "Penilaian ini dihasilkan AI berdasarkan rubrik tetap dan bersifat panduan latihan. Hasil negosiasi nyata dapat berbeda tergantung konteks dan dinamika hubungan bisnis.":
    "This evaluation is generated by AI using a fixed rubric and is a practice guide. Real negotiations may differ depending on context and business relationships.",
  "Terus berlatih": "Keep practicing",
  "Coba skenario yang sama dengan strategi baru.":
    "Try the same scenario with a new strategy.",
  "Bandingkan skor dan lihat perkembangan Anda di dashboard.":
    "Compare scores and track your progress on the dashboard.",
  "Ulangi skenario": "Retry scenario",
  Contoh: "examples",
  "Memuat hasil evaluasi...": "Loading evaluation results...",
  "Evaluasi tidak ditemukan": "Evaluation not found",
  "Sesi lokal tidak tersedia di browser ini.":
    "The local session is not available in this browser.",
  "Mulai sesi baru": "Start a new session",
  "Sesi masih berlangsung": "Session still in progress",
  "Kembali ke negosiasi": "Back to negotiation",
  "Evaluasi belum tersedia": "Evaluation not available yet",
  "Selesaikan sesi negosiasi untuk mendapatkan skor 5 aspek.":
    "Complete the negotiation session to get 5-aspect scores.",
  "Kembali ke sesi": "Back to session",
  "Sesi selesai": "Session completed",
  "Memuat ruang negosiasi...": "Loading negotiation room...",
  "Sesi tidak ditemukan": "Session not found",
  "Sesi lokal mungkin sudah dihapus dari browser ini.":
    "The local session may have been removed from this browser.",
};

const id: Record<string, string> = {};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("siapdeal:language") ??
        localStorage.getItem("siapdeal:ai-language");
      if (stored === "en" || stored === "id") {
        setLanguageState(stored);
      }
    } catch {
      // localStorage bisa diblokir di mode privat.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "id";
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem("siapdeal:language", next);
      localStorage.setItem("siapdeal:ai-language", next);
    } catch {
      // Abaikan jika penyimpanan diblokir.
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const text = language === "en" ? en[key] ?? key : id[key] ?? key;
      if (!vars) return text;
      return Object.entries(vars).reduce(
        (result, [name, value]) =>
          result.replaceAll(`{${name}}`, String(value)),
        text
      );
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return value;
}

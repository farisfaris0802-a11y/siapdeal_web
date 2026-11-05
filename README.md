# SiapDeal by NegoLab — AI B2B Negotiation Simulator for Bali SMEs

> **Bali DigiFest 2026 · AI Web Innovation Challenge**
> “Flight simulator” negosiasi B2B untuk UMKM Bali. Latih harga, margin, titip jual, dan TOP sebelum bertemu pembeli sungguhan.

SiapDeal menghadirkan pembeli virtual yang realistis dari tiga segmen kunci pariwisata Bali: **F&B Director hotel resort**, **manager pusat oleh-oleh**, dan **owner beach club/kafe modern**. Setiap pembeli punya karakter, batas harga rahasia, dan playbook tuntutan yang konsisten. Setelah sesi, AI menilai transkrip dengan rubrik tetap 5 aspek dan memberi contoh kalimat yang lebih kuat.

**Live demo:** `<https://siapdeal.vercel.app>` — ganti dengan URL deployment Vercel Anda sebelum submit.

---

## 1. Fitur Utama

| Fitur | Implementasi |
| --- | --- |
| **Quick Demo Login as Judge** | Supabase Anonymous Sign-In (satu klik, tanpa registrasi) + fallback akun demo. Juri langsung masuk ke skenario contoh Bali yang sudah terisi. |
| **Skenario fleksibel** | Nama produk, harga dasar, kategori, USP; 3 tipe mitra Bali × 3 level kesulitan = 9 persona. |
| **Chat negosiasi streaming** | `useChat` + Vercel AI SDK 4, respons token demi token, transkrip tersimpan otomatis. |
| **Pembeli virtual konsisten** | System prompt terkunci: identitas, playbook mitra, target harga rahasia, aturan TOP/konsinyasi, dan larangan keluar karakter. |
| **Auto-end sesi** | Model menulis `[[DEAL]]` / `[[NO_DEAL]]` pada baris terakhir. Client mendeteksi, menandai sesi selesai, lalu memicu evaluasi otomatis. |
| **Evaluasi 5 aspek** | `generateObject()` + Zod schema: skor 0–100, feedback spesifik, kekuatan, kelemahan, 2–4 kalimat pengganti. |
| **Visual hasil** | Radar chart SVG 5 aspek, progress bar per aspek, score ring, verdict, dan transkrip lengkap. |
| **Dashboard progres** | Rata-rata skor, skor terbaik, delta perkembangan, aspek terlemah, riwayat seluruh sesi. |
| **Auth & RLS** | Supabase Auth + Row Level Security di semua tabel. Data antar-juri/UMKM terisolasi. |
| **Responsif** | Tailwind CSS 3, komponen shadcn/ui (Radix), Lucide React. |

---

## 2. Tech Stack

| Layer | Teknologi |
| --- | --- |
| Framework | **Next.js 14.2 App Router**, React 18, TypeScript, Server Actions |
| UI | **Tailwind CSS 3**, komponen shadcn/ui (Radix UI), **Lucide React**, Sonner |
| Database | **Supabase PostgreSQL**, RLS, SQL migration + seed |
| Auth | **Supabase Auth** — email/password + **Anonymous Sign-Ins** untuk juri |
| AI | **Vercel AI SDK 4** (`ai`), `@ai-sdk/google` (Gemini) atau `@ai-sdk/openai` |
| AI Output | `streamText()` untuk chat, `generateObject()` + Zod untuk evaluasi |
| Charts | SVG radar & line chart buatan sendiri (tanpa dependency chart tambahan) |
| Deployment | **Vercel** (Node runtime, `maxDuration = 60`) |

---

## 3. Arsitektur

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         Next.js 14 App Router                       â”‚
â”‚                                                                     â”‚
â”‚  /                        Landing + Quick Demo Login (Server Action) â”‚
â”‚  /simulasi/baru           Scenario form (Server Action â†’ Supabase)  â”‚
â”‚  /simulasi/[id]           Streaming chat (useChat)                  â”‚
â”‚  /simulasi/[id]/hasil     Radar + rubric + transcript               â”‚
â”‚  /dashboard               Progress & history                        â”‚
â”‚                                                                     â”‚
â”‚  POST /api/chat           Auth â†’ validate â†’ streamText â†’ persist    â”‚
â”‚  POST /api/evaluate       Auth â†’ transcript â†’ generateObject â†’ DB   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚                               â”‚
        â”Œâ”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”              â”Œâ”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚    Supabase    â”‚              â”‚  AI Provider   â”‚
        â”‚  PostgreSQL    â”‚              â”‚ Gemini / GPT   â”‚
        â”‚  Auth + RLS    â”‚              â”‚ streaming +    â”‚
        â”‚  5 tables      â”‚              â”‚ structured out â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Struktur folder

```
app/
  page.tsx                         Landing + judge CTA
  login/, register/                Auth pages + quick demo button
  auth/callback/, auth/signout/    Supabase auth routes
  (app)/                           Auth-guarded app shell
    dashboard/                     Statistik, grafik, riwayat
    simulasi/baru/                 Form skenario + prefill ?demo=1
    simulasi/[id]/                 Chat negosiasi
    simulasi/[id]/hasil/           Hasil evaluasi + radar
  api/chat/route.ts                Streaming + persistensi
  api/evaluate/route.ts            Evaluasi terstruktur
components/
  ui/                              shadcn-style primitives
  simulation/                      Form, chat, evaluation
  auth/judge-login-button.tsx      Quick demo login (useFormStatus)
  score-radar.tsx, score-chart.tsx, score-ring.tsx
lib/
  ai/personas.ts                   3 mitra × 3 level, 5 rubrik, opening lines
  ai/buyer-prompt.ts               System prompt + secret floor + token control
  ai/evaluation.ts                 Zod schema + rubric prompt + mapper
  ai/model.ts                      Resolusi provider Gemini/OpenAI
  actions/auth.ts                  Login/register + judge login
  actions/simulation.ts            Buat product + session + greeting
  supabase/                        Server/browser/middleware clients
  catalog.ts                       Kategori + contoh produk Bali
supabase/migrations/
  20260101000000_init.sql          Schema, RLS, seed 9 persona
  20260101000001_seed_buyer_personas.sql  Seed persona idempotent
```

---

## 4. AI Implementation

### 4.1 Persona pembeli Bali

| `partner_type` | Profil | Tuntutan khas |
| --- | --- | --- |
| `hotel_resort_bali` | **Ibu Ayu Prameswari** — F&B Director, Amrita Resort & Spa Nusa Dua | Volume 150–300 pcs/bulan, harga distributor, TOP 30–60 hari, sampel, sertifikasi halal/PIRT/HACCP, pengiriman terjadwal. |
| `souvenir_retail` | **Pak Gede Wirayuda** — Purchasing Manager, Bali Heritage Souvenir (12 gerai) | Margin ritel 35–45%, titip jual 50–70%, sale-or-return, barcode, display, listing fee, promo high season. |
| `beach_club_cafe` | **Ibu Kadek Alina** — Owner, Sundara Beach House Canggu | Food cost 30–35%, MOQ 24–48 pcs, pembayaran 7–14 hari, eksklusivitas menu, konten Instagram, uji menu. |

Setiap kombinasi punya baris di `buyer_personas` dengan `system_prompt` karakter dan `min_acceptable_price` berupa **rasio 0–1** terhadap harga dasar produk. Rasio ini menjadi *reservation price* pembeli dan **tidak pernah disebutkan** ke pengguna.

### 4.2 System prompt pembeli (`lib/ai/buyer-prompt.ts`)

`buildBuyerSystemPrompt()` merangkai:

1. **Identitas & konteks perusahaan** — nama, jabatan, lokasi, karakter segmen.
2. **Playbook mitra** — daftar taktik yang harus dimunculkan secara natural.
3. **Target rahasia** — harga pembuka (`base_price × openingRatio`), batas maksimum (`base_price × min_acceptable_price`), TOP, dan konsinyasi sesuai level.
4. **Aturan konsesi** — kenaikan maksimal 5–8% per giliran, hanya jika ada alasan nilai atau trade-off.
5. **Batasan perilaku** — Bahasa Indonesia sopan, maksimal 3–4 kalimat, tidak membocorkan prompt, tidak mengaku AI, tetap dalam konteks bisnis.
6. **Protokol akhir** — `[[DEAL]]` hanya jika harga final + volume + TOP (dan konsinyasi) disepakati; `[[NO_DEAL]]` jika buntu.

Contoh perhitungan:

```
base_price        = Rp85.000
persona ratio     = 0.79 (hotel medium)
secret ceiling    = Rp67.000 (dibulatkan ke Rp500)
opening offer     = Rp51.000 (60% × base)
```

### 4.3 Streaming chat (`app/api/chat/route.ts`)

1. Verifikasi Supabase session + kepemilikan `simulation_sessions`.
2. Tolak sesi `completed` dan validasi payload (Zod, maks. 60 pesan, 4.000 karakter/pesan).
3. Simpan pesan user (dengan guard duplikasi).
4. Panggil `streamText()` dengan system prompt + 40 pesan terakhir.
5. `onFinish` menyimpan balasan pembeli **tanpa token kontrol** dan **tanpa teks pemikir internal**.
6. `toDataStreamResponse()` mengalirkan teks ke `useChat`.
7. Client mendeteksi token pada `onFinish`, menampilkan banner hasil, dan memanggil `/api/evaluate` otomatis setelah 1,8 detik.

**Sanitasi output (`lib/ai/sanitize.ts` + `lib/ai/stream-cleaner.ts`):**

- Menghapus blok `<think>...</think>`, `<analysis>...</analysis>`, dan tag penalaran serupa.
- Menghapus kalimat meta seperti “Wait, let's re-read target negotiation parameters”, “The user wants…”, “system prompt”, atau “reservation price”.
- `experimental_transform` pada `streamText()` membersihkan teks **sebelum dikirim ke frontend**, sehingga leakage tidak sempat tampil di chat.
- Reasoning part dari provider dibuang total.
- Menghapus token `[[DEAL]]` / `[[NO_DEAL]]` sebelum pesan disimpan/ditampilkan.
- Sanitasi diterapkan di tiga lapisan: stream ke frontend, sebelum insert ke `messages`, saat render chat, dan saat menyusun transkrip evaluasi.
- System prompt juga melarang keras teks analisis internal dan mewajibkan balasan langsung dalam Bahasa Indonesia.

### 4.4 Evaluasi (`app/api/evaluate/route.ts`)

- Memuat sesi + produk + persona + seluruh transkrip; memastikan sesi milik user.
- Idempotent: jika evaluasi sudah ada, mengembalikan yang lama (mencegah duplikasi saat retry/race).
- `generateObject()` dengan Zod schema memaksa JSON:
  - 5 skor + feedback per aspek
  - ringkasan 2–3 kalimat
  - 2–4 kekuatan, 2–4 kelemahan
  - 2–4 `rephrased_suggestions` (`original`, `improved`, `reason`)
- Skor total = rata-rata 5 aspek; verdict `siap` â‰¥80, `cukup` â‰¥60, `perlu_latihan` <60.
- Menyimpan ke `evaluations` dan menandai sesi `completed` + `outcome`.

### 4.5 Rubrik tetap

| # | Aspek | English | Yang dinilai |
| --- | --- | --- | --- |
| 1 | Kejelasan Penawaran | Offer Clarity | Harga, isi paket, volume, MOQ, PPN, pengiriman, syarat. |
| 2 | Penyampaian Nilai Produk | Value Proposition | USP diterjemahkan ke manfaat bisnis mitra Bali. |
| 3 | Cara Menjawab Keberatan | Objection Handling | Margin, TOP, titip jual, kualitas, sertifikasi, kompetitor. |
| 4 | Fleksibilitas Margin & Batas Toleransi | Margin Flexibility | Konsesi terukur, trade-off, batas harga terjaga. |
| 5 | Ketegasan Menutup Kesepakatan | Closing Assertion | Harga final, volume, TOP, langkah lanjutan. |

### 4.6 Pemilihan model

`lib/ai/model.ts` memilih provider otomatis:

- `GOOGLE_GENERATIVE_AI_API_KEY` / `GEMINI_API_KEY` â†’ Gemini (`AI_MODEL` default `gemini-3.5-flash`).
- Jika tidak ada, `OPENAI_API_KEY` â†’ OpenAI (`AI_MODEL` default `gpt-4o-mini`).

---

## 5. Database Schema (Supabase SQL)

File: `supabase/migrations/20260101000000_init.sql`

| Tabel | Kolom | Catatan |
| --- | --- | --- |
| `products` | `id`, `user_id`, `name`, `base_price`, `usp`, `category`, `created_at` | `category` âˆˆ `kopi_minuman`, `makanan_olahan`, `spa_wellness`, `fashion_kriya`, `lainnya`. |
| `buyer_personas` | `id`, `partner_type`, `difficulty`, `system_prompt`, `min_acceptable_price` | Seed 9 baris; `min_acceptable_price` = rasio 0–1 terhadap harga dasar. |
| `simulation_sessions` | `id`, `user_id`, `product_id`, `buyer_persona_id`, `status`, `outcome`, `created_at`, `ended_at` | `outcome` & `ended_at` adalah ekstensi untuk dashboard. |
| `messages` | `id`, `session_id`, `role`, `content`, `created_at` | Role `user` / `assistant`. |
| `evaluations` | `id`, `session_id`, `rubric_scores` (jsonb), `strengths` (text[]), `weaknesses` (text[]), `rephrased_suggestions` (jsonb), `created_at` | `session_id` unik = satu evaluasi per sesi. |

**RLS** aktif di semua tabel:

- `products`, `simulation_sessions`: hanya baris dengan `auth.uid() = user_id`.
- `messages`, `evaluations`: akses melalui `exists (... simulation_sessions.user_id = auth.uid())`.
- `buyer_personas`: read-only untuk role `authenticated`.

`rubric_scores` berbentuk:

```json
{
  "aspects": [
    {
      "key": "kejelasan_penawaran",
      "label": "Kejelasan Penawaran",
      "score": 84,
      "feedback": "..."
    }
  ],
  "overall": 74,
  "verdict": "cukup",
  "summary": "..."
}
```

---

## 6. Run Instructions

### Prasyarat

- Node.js 18.17+ (disarankan 20/22) **atau** Bun 1.1+
- Akun [Supabase](https://supabase.com) (free tier cukup)
- API key Google Gemini **atau** OpenAI

### Langkah 1 — Install

```bash
npm install
# atau: bun install
```

### Langkah 2 — Setup Supabase

1. Buat project baru di Supabase.
2. Buka **SQL Editor**, salin seluruh isi `supabase/migrations/20260101000000_init.sql`, lalu **Run**.
   Ini membuat 5 tabel, index, RLS policy, dan seed 9 persona Bali.
   Jika tabel sudah pernah dibuat tetapi persona kosong, cukup jalankan
   `supabase/migrations/20260101000001_seed_buyer_personas.sql`
   (idempotent — aman dijalankan berulang).
3. **Authentication â†’ Providers â†’ Email**:
   - Untuk development, matikan **Confirm email** agar bisa langsung masuk.
   - Jika aktif, tambahkan `http://localhost:3000/auth/callback` ke **URL Configuration â†’ Redirect URLs**.
4. **Authentication â†’ Providers â†’ Anonymous** â†’ **Enable**.
   Diperlukan untuk tombol **Quick Demo Login as Judge**. Anonymous user tetap mendapat role `authenticated`, sehingga RLS berlaku.
5. *(Opsional, akun juri tetap)* Buat user di **Authentication â†’ Users**, lalu isi `DEMO_JUDGE_EMAIL` dan `DEMO_JUDGE_PASSWORD`.

### Langkah 3 — Environment

```bash
cp .env.example .env.local
```

Isi minimal:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
AI_MODEL=gemini-3.5-flash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Untuk juri:

```env
JUDGE_ANONYMOUS_ENABLED=true
# Opsional, lebih stabil:
# DEMO_JUDGE_EMAIL=juri@siapdeal.id
# DEMO_JUDGE_PASSWORD=password-kuat
```

### Langkah 4 — Jalankan

```bash
npm run dev
# atau: bun run dev
```

Buka **http://localhost:3000**.

### Script

```bash
npm run dev        # development
npm run build      # production build
npm run start      # menjalankan hasil build
npm run lint       # ESLint
npm run typecheck  # TypeScript tanpa emit
```

### Alur demo 3 menit untuk juri

1. Buka landing â†’ klik **Quick Demo Login as Judge** (tanpa registrasi).
2. Form skenario sudah terisi **Kopi Arabika Kintamani 250 gr × Hotel Resort × Medium**.
   Anda juga bisa mengganti ke contoh **Sabun Spa Frangipani** atau **Sambal Matah Premium**.
3. Klik **Mulai simulasi**. Pembeli membuka percakapan.
4. Jawab 3–5 giliran: tahan harga, tanyakan volume, tawarkan sampel/kontrak, jawab TOP.
5. Sesi berakhir otomatis saat sepakat/buntu, atau klik **Akhiri sesi**.
6. Lihat **skor 5 aspek, radar chart, kekuatan/kelemahan, dan kalimat pengganti**.
7. Buka **Dashboard** untuk melihat riwayat dan progres.

---

## 7. API Routes

| Route | Method | Fungsi |
| --- | --- | --- |
| `/api/chat` | `POST` | Validasi session + ownership, simpan pesan user, streaming balasan pembeli, simpan balasan di `onFinish`. |
| `/api/evaluate` | `POST` | Validasi session, jalankan `generateObject()` dengan rubrik 5 aspek, simpan evaluasi (idempotent), tandai sesi selesai. |

Keduanya memakai `maxDuration = 60` untuk Vercel.

---

## 8. Deployment ke Vercel

1. Push project ke GitHub.
2. Import di Vercel â†’ framework terdeteksi **Next.js**.
3. Tambahkan environment variables yang sama dengan `.env.local`.
4. Di Supabase â†’ **Authentication â†’ URL Configuration**:
   - Site URL: `https://domain-anda.vercel.app`
   - Redirect URLs: `https://domain-anda.vercel.app/auth/callback`
5. Deploy.
6. Ganti placeholder **Live demo** di README dengan URL Vercel Anda.
7. Uji Quick Demo Login di production sebelum submit.

**Deployment URL:** `https://siapdeal.vercel.app` *(placeholder — isi setelah deploy)*

---

## 9. Keamanan, Privasi, dan Batasan

- RLS aktif di seluruh tabel; API memverifikasi user + kepemilikan sesi sebelum memanggil model.
- Prompt pembeli melarang membocorkan instruksi, batas harga, atau keluar karakter.
- Token kontrol `[[DEAL]]`/`[[NO_DEAL]]` dibersihkan sebelum disimpan dan tidak ditampilkan.
- Payload dibatasi: maks. 60 pesan/request, 4.000 karakter/pesan, 1.200 karakter USP.
- Data produk dan transkrip dikirim ke provider AI (Gemini/OpenAI) untuk simulasi. Jangan masukkan rahasia dagang yang tidak boleh keluar organisasi.
- Penilaian AI adalah alat bantu latihan, bukan jaminan hasil negosiasi nyata.
- MVP belum mencakup: pembayaran/langganan, multi-user per akun, ekspor PDF, leaderboard, dan reusable product library.
- Kuota Gemini free tier dapat membatasi demo publik; gunakan akun demo dengan kuota memadai atau fallback OpenAI.

---

## 10. Troubleshooting

| Masalah | Solusi |
| --- | --- |
| `Supabase belum dikonfigurasi` | Isi URL + anon key di `.env.local`, restart dev server. |
| Quick Demo Login gagal | Aktifkan **Anonymous Sign-Ins** di Supabase, atau isi `DEMO_JUDGE_EMAIL`/`DEMO_JUDGE_PASSWORD`. |
| `Profil pembeli belum tersedia` | Jalankan ulang bagian seed pada migration SQL. |
| `API key AI belum diatur` | Isi `GOOGLE_GENERATIVE_AI_API_KEY` atau `OPENAI_API_KEY`, restart server. |
| Evaluasi timeout | Coba lagi; periksa kuota provider dan pastikan model mendukung structured output. |
| Radar tidak muncul | Radar hanya tampil pada sesi yang sudah memiliki evaluasi. |
| Email konfirmasi tidak masuk | Matikan Confirm email untuk demo, atau atur SMTP/redirect URL. |

---

## 11. Kredit

Dibuat untuk **Bali DigiFest 2026 · AI Web Innovation Challenge**.
Nama produk, persona, playbook, dan rubrik dapat disesuaikan di `lib/ai/personas.ts` dan seed SQL.


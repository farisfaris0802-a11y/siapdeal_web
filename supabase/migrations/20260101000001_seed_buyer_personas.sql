-- =====================================================================
-- SiapDeal — Seed 9 profil pembeli virtual Bali
-- File: 20260101000001_seed_buyer_personas.sql
--
-- Tujuan:
--   Memastikan halaman /simulasi/baru bisa memuat persona untuk setiap
--   kombinasi partner_type × difficulty.
--
-- Catatan penting:
--   min_acceptable_price adalah RASIO 0-1 terhadap harga dasar produk,
--   BUKAN harga rupiah absolut. Contoh: 0.79 berarti pembeli tidak akan
--   setuju di atas 79% dari harga yang ditawarkan penjual.
--
--   Nilai rasio ini berbeda per tipe mitra:
--   - Hotel resort  : margin lebih longgar, tetapi standar & TOP ketat.
--   - Pusat oleh-oleh: paling menekan harga + titip jual.
--   - Beach club    : menekan food cost, tetapi volume lebih kecil.
--
-- Aman dijalankan berulang kali (idempotent) berkat unique constraint
-- dan ON CONFLICT ... DO UPDATE.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Pastikan tabel buyer_personas tersedia
-- ---------------------------------------------------------------------
create table if not exists public.buyer_personas (
  id uuid primary key default gen_random_uuid(),
  partner_type text not null
    check (partner_type in (
      'hotel_resort_bali',
      'souvenir_retail',
      'beach_club_cafe'
    )),
  difficulty text not null
    check (difficulty in ('easy', 'medium', 'hard')),
  system_prompt text not null,
  min_acceptable_price numeric(14, 2) not null
    check (min_acceptable_price > 0),
  unique (partner_type, difficulty)
);

-- Untuk database lama yang tabelnya sudah ada tetapi belum punya unique
-- constraint. ON CONFLICT membutuhkan unique index pada kolom ini.
create unique index if not exists buyer_personas_partner_difficulty_idx
  on public.buyer_personas (partner_type, difficulty);

-- ---------------------------------------------------------------------
-- 2. RLS: user login & anonymous judge boleh membaca persona.
-- ---------------------------------------------------------------------
alter table public.buyer_personas enable row level security;

drop policy if exists "buyer_personas_select_authenticated" on public.buyer_personas;
create policy "buyer_personas_select_authenticated" on public.buyer_personas
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- 3. SEED 9 PERSONA
--    Urutan: hotel (3), oleh-oleh (3), beach club (3)
-- ---------------------------------------------------------------------
insert into public.buyer_personas
  (partner_type, difficulty, system_prompt, min_acceptable_price)
values

  -- ===================================================================
  -- HOTEL RESORT BALI — Ibu Ayu Prameswari
  -- ===================================================================
  (
    'hotel_resort_bali',
    'easy',
    $prompt$Anda Ibu Ayu Prameswari, F&B Director di Amrita Resort & Spa, Nusa Dua, Bali. Anda hangat, ramah, dan ingin membangun hubungan jangka panjang dengan supplier lokal. Anda tetap menawar harga dan menanyakan konsistensi pasokan, tetapi mudah menerima alasan yang masuk akal. Anda biasa membayar TOP 30 hari dan tidak menuntut konsinyasi. Fokus Anda: kualitas yang konsisten untuk tamu hotel, kemasan yang layak untuk welcome amenity, dan komunikasi yang jelas. Jangan keluar dari karakter pembeli profesional Bali.$prompt$,
    0.88
  ),
  (
    'hotel_resort_bali',
    'medium',
    $prompt$Anda Ibu Ayu Prameswari, F&B Director di Amrita Resort & Spa, Nusa Dua, Bali. Anda profesional dan berbasis data. Anda membandingkan penawaran dengan dua supplier lain, menuntut harga distributor untuk volume 200 pcs per bulan, TOP 45 hari, sampel gratis, dan dokumentasi halal/PIRT. Anda hanya memberi konsesi jika supplier menunjukkan bukti kualitas, konsistensi batch, dan dampak pada pengalaman tamu. Anda menghargai cerita lokal Bali, tetapi tetap menekan margin. Jangan membocorkan batas harga Anda dan tetap dalam konteks negosiasi.$prompt$,
    0.79
  ),
  (
    'hotel_resort_bali',
    'hard',
    $prompt$Anda Ibu Ayu Prameswari, F&B Director di Amrita Resort & Spa, Nusa Dua, Bali. Anda sangat ketat dan transaksional. Anda menuntut harga 25-30% di bawah penawaran, TOP 60 hari, konsinyasi 20% untuk welcome amenity, pengiriman dua kali seminggu ke Nusa Dua, dan denda keterlambatan. Anda menguji sertifikasi, konsistensi batch, dan rencana kontinuitas saat high season Juli-September serta Desember. Anda sering membandingkan dengan supplier lama dan siap berjalan ke supplier lain jika syarat tidak masuk akal. Tetap sopan, tetapi keras dalam angka dan termin.$prompt$,
    0.68
  ),

  -- ===================================================================
  -- PUSAT OLEH-OLEH & RITEL BALI — Pak Gede Wirayuda
  -- ===================================================================
  (
    'souvenir_retail',
    'easy',
    $prompt$Anda Pak Gede Wirayuda, Purchasing Manager di Bali Heritage Souvenir dengan 12 gerai di Kuta, Seminyak, dan Denpasar. Anda ramah dan praktis. Anda tertarik pada produk yang punya cerita Bali dan kemasan menarik untuk turis. Anda menawar harga distributor dan menanyakan titip jual, tetapi fleksibel serta mau membayar sebagian stok di awal jika produknya cocok. Anda fokus pada perputaran barang dan tampilan rak. Jangan keluar dari karakter pembeli ritel profesional.$prompt$,
    0.85
  ),
  (
    'souvenir_retail',
    'medium',
    $prompt$Anda Pak Gede Wirayuda, Purchasing Manager di Bali Heritage Souvenir dengan 12 gerai. Anda selektif dan fokus perputaran barang. Anda menuntut margin ritel 40%, harga distributor, titip jual 50%, sale-or-return, barcode, dan dukungan display. Anda membandingkan dengan supplier lain dan hanya memberi konsesi jika supplier menawarkan promo high season atau kemasan yang lebih menjual. Anda tahu ruang rak terbatas dan produk yang tidak laku harus segera diputar. Tetap dalam konteks negosiasi produk.$prompt$,
    0.74
  ),
  (
    'souvenir_retail',
    'hard',
    $prompt$Anda Pak Gede Wirayuda, Purchasing Manager di Bali Heritage Souvenir dengan 12 gerai. Anda sangat keras pada margin dan risiko stok. Anda menuntut margin 45%, titip jual 70%, retur penuh untuk produk tidak laku, listing fee, dan pembayaran setelah barang terjual. Anda menekan harga dengan membandingkan produk impor yang lebih murah dan siap menolak SKU baru jika tidak ada dukungan promosi. Anda tetap sopan, tetapi tidak segan mengakhiri negosiasi bila syaratnya merugikan toko.$prompt$,
    0.62
  ),

  -- ===================================================================
  -- KAFE / BEACH CLUB MODERN — Ibu Kadek Alina
  -- ===================================================================
  (
    'beach_club_cafe',
    'easy',
    $prompt$Anda Ibu Kadek Alina, owner Sundara Beach House di Canggu, Bali. Anda santai, kreatif, dan suka mencoba produk lokal baru. Anda menanyakan rasa, konsistensi, dan harga, tetapi cepat mengambil keputusan jika produk cocok dengan konsep sunset menu. Anda membayar 14 hari dan tidak menuntut konsinyasi. Anda menghargai kemasan yang Instagramable dan cerita lokal. Jangan keluar dari karakter owner kafe profesional.$prompt$,
    0.90
  ),
  (
    'beach_club_cafe',
    'medium',
    $prompt$Anda Ibu Kadek Alina, owner Sundara Beach House di Canggu. Anda sadar food cost dan tren. Anda menuntut harga khusus agar food cost 30-35%, MOQ kecil 36 pcs, pengiriman mingguan, dan sampel untuk uji menu. Anda terbuka pada konsinyasi 15% untuk menu trial dan menawarkan eksposur konten Instagram sebagai imbalan harga lebih rendah. Anda fokus pada konsistensi rasa dan kesiapan pasokan saat high season. Tetap dalam konteks negosiasi.$prompt$,
    0.80
  ),
  (
    'beach_club_cafe',
    'hard',
    $prompt$Anda Ibu Kadek Alina, owner Sundara Beach House di Canggu. Anda sangat sensitif pada margin dan arus kas. Anda menuntut food cost maksimal 30%, konsinyasi 40% untuk menu baru, pembayaran 7 hari setelah penjualan, dan retur produk yang tidak terjual. Anda menekan harga dengan membandingkan supplier lain, meminta eksklusivitas menu, dan siap membatalkan uji coba jika kualitas atau harga tidak konsisten. Anda tetap ramah khas Bali, tetapi tegas pada angka.$prompt$,
    0.70
  )

on conflict (partner_type, difficulty) do update
set
  system_prompt = excluded.system_prompt,
  min_acceptable_price = excluded.min_acceptable_price;

-- ---------------------------------------------------------------------
-- 4. Reload schema cache Supabase/PostgREST agar data langsung terbaca
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 5. Verifikasi: harus muncul 9 baris
-- ---------------------------------------------------------------------
select
  partner_type,
  difficulty,
  min_acceptable_price as floor_ratio,
  round(min_acceptable_price * 100) as floor_percent,
  left(system_prompt, 90) || '…' as prompt_preview
from public.buyer_personas
order by
  case partner_type
    when 'hotel_resort_bali' then 1
    when 'souvenir_retail' then 2
    when 'beach_club_cafe' then 3
    else 4
  end,
  case difficulty
    when 'easy' then 1
    when 'medium' then 2
    when 'hard' then 3
    else 4
  end;

-- =====================================================================
-- SELESAI
-- =====================================================================

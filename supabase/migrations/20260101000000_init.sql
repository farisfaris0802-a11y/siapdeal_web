-- =====================================================================
-- SiapDeal — Skema awal MVP AI Negotiation Simulator untuk UMKM Bali
-- Bali DigiFest 2026 · AI Web Innovation Challenge
--
-- Jalankan di Supabase SQL Editor atau via `supabase db push`.
-- Login juri memakai Supabase Anonymous Sign-Ins (aktifkan di
-- Authentication → Providers → Anonymous). Anonymous user tetap
-- mendapat role `authenticated`, sehingga RLS di bawah berlaku.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. products
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  base_price numeric(14, 2) not null check (base_price > 0),
  usp text not null default '' check (char_length(usp) <= 1200),
  category text not null default 'lainnya'
    check (category in (
      'kopi_minuman',
      'makanan_olahan',
      'spa_wellness',
      'fashion_kriya',
      'lainnya'
    )),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_user_id_created_at_idx
  on public.products (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. buyer_personas
-- 9 kombinasi: 3 tipe mitra Bali × 3 tingkat kesulitan.
--
-- min_acceptable_price disimpan sebagai RASIO (0-1) terhadap harga dasar
-- produk. Contoh 0.72 berarti pembeli tidak akan setuju di atas 72% dari
-- harga yang ditawarkan. Nilai > 1 tetap didukung sebagai harga absolut
-- untuk kompatibilitas data lama.
-- ---------------------------------------------------------------------
create table if not exists public.buyer_personas (
  id uuid primary key default gen_random_uuid(),
  partner_type text not null
    check (partner_type in (
      'hotel_resort_bali',
      'souvenir_retail',
      'beach_club_cafe'
    )),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  system_prompt text not null,
  min_acceptable_price numeric(14, 2) not null check (min_acceptable_price > 0),
  unique (partner_type, difficulty)
);

-- ---------------------------------------------------------------------
-- 3. simulation_sessions
-- outcome & ended_at adalah ekstensi kecil untuk kebutuhan UI/history.
-- ---------------------------------------------------------------------
create table if not exists public.simulation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_persona_id uuid not null references public.buyer_personas (id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed')),
  outcome text check (outcome in ('deal', 'no_deal', 'manual')),
  created_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz
);

create index if not exists simulation_sessions_user_id_created_at_idx
  on public.simulation_sessions (user_id, created_at desc);

create index if not exists simulation_sessions_product_id_idx
  on public.simulation_sessions (product_id);

-- ---------------------------------------------------------------------
-- 4. messages
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.simulation_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists messages_session_id_created_at_idx
  on public.messages (session_id, created_at asc);

-- ---------------------------------------------------------------------
-- 5. evaluations
-- rubric_scores: { aspects: [...], overall, verdict, summary }
-- rephrased_suggestions: [{ aspect, aspect_label, original, improved, reason }]
-- ---------------------------------------------------------------------
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.simulation_sessions (id) on delete cascade,
  rubric_scores jsonb not null,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  rephrased_suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists evaluations_session_id_idx
  on public.evaluations (session_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.products enable row level security;
alter table public.buyer_personas enable row level security;
alter table public.simulation_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.evaluations enable row level security;

-- ---------- products ----------
drop policy if exists "products_select_own" on public.products;
create policy "products_select_own" on public.products
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- buyer_personas (read-only untuk user & juri terautentikasi) ----------
drop policy if exists "buyer_personas_select_authenticated" on public.buyer_personas;
create policy "buyer_personas_select_authenticated" on public.buyer_personas
  for select to authenticated
  using (true);

-- ---------- simulation_sessions ----------
drop policy if exists "sessions_select_own" on public.simulation_sessions;
create policy "sessions_select_own" on public.simulation_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "sessions_insert_own" on public.simulation_sessions;
create policy "sessions_insert_own" on public.simulation_sessions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "sessions_update_own" on public.simulation_sessions;
create policy "sessions_update_own" on public.simulation_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "sessions_delete_own" on public.simulation_sessions;
create policy "sessions_delete_own" on public.simulation_sessions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- messages ----------
drop policy if exists "messages_select_own_session" on public.messages;
create policy "messages_select_own_session" on public.messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.simulation_sessions s
      where s.id = messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "messages_insert_own_session" on public.messages;
create policy "messages_insert_own_session" on public.messages
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.simulation_sessions s
      where s.id = messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

-- ---------- evaluations ----------
drop policy if exists "evaluations_select_own_session" on public.evaluations;
create policy "evaluations_select_own_session" on public.evaluations
  for select to authenticated
  using (
    exists (
      select 1
      from public.simulation_sessions s
      where s.id = evaluations.session_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "evaluations_insert_own_session" on public.evaluations;
create policy "evaluations_insert_own_session" on public.evaluations
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.simulation_sessions s
      where s.id = evaluations.session_id
        and s.user_id = (select auth.uid())
    )
  );

-- =====================================================================
-- SEED: 9 profil pembeli virtual Bali (3 mitra × 3 level)
-- =====================================================================
insert into public.buyer_personas (partner_type, difficulty, system_prompt, min_acceptable_price)
values
  -- ============================ HOTEL RESORT BALI ============================
  (
    'hotel_resort_bali', 'easy',
    'Anda Ibu Ayu Prameswari, F&B Director Amrita Resort & Spa Nusa Dua. Anda hangat, ramah, dan ingin membangun hubungan jangka panjang dengan supplier lokal. Anda tetap menawar harga dan menanyakan konsistensi pasokan, tetapi mudah menerima alasan yang masuk akal. Anda membayar TOP 30 hari dan tidak menuntut konsinyasi.',
    0.88
  ),
  (
    'hotel_resort_bali', 'medium',
    'Anda Ibu Ayu Prameswari, F&B Director Amrita Resort & Spa Nusa Dua. Anda profesional dan berbasis data. Anda membandingkan penawaran dengan dua supplier lain, menuntut harga distributor untuk volume 200 pcs/bulan, TOP 45 hari, sampel gratis, dan dokumentasi halal/PIRT. Anda hanya memberi konsesi jika supplier menunjukkan bukti kualitas dan dampak pada pengalaman tamu.',
    0.79
  ),
  (
    'hotel_resort_bali', 'hard',
    'Anda Ibu Ayu Prameswari, F&B Director Amrita Resort & Spa Nusa Dua. Anda sangat ketat dan transaksional. Anda menuntut harga 25-30% di bawah penawaran, TOP 60 hari, konsinyasi 20% untuk welcome amenity, pengiriman dua kali seminggu ke Nusa Dua, dan denda keterlambatan. Anda menguji sertifikasi, konsistensi batch, dan rencana kontinuitas saat high season. Anda siap berjalan ke supplier lama jika syarat tidak masuk akal.',
    0.68
  ),
  -- ============================ PUSAT OLEH-OLEH ============================
  (
    'souvenir_retail', 'easy',
    'Anda Pak Gede Wirayuda, Purchasing Manager Bali Heritage Souvenir dengan 12 gerai. Anda ramah dan praktis. Anda tertarik pada produk yang punya cerita Bali dan kemasan menarik. Anda menawar harga distributor dan menanyakan titip jual, tetapi fleksibel dan mau membayar sebagian stok di awal jika produknya cocok.',
    0.85
  ),
  (
    'souvenir_retail', 'medium',
    'Anda Pak Gede Wirayuda, Purchasing Manager Bali Heritage Souvenir dengan 12 gerai. Anda selektif dan fokus perputaran barang. Anda menuntut margin ritel 40%, harga distributor, titip jual 50%, sale-or-return, barcode, dan dukungan display. Anda membandingkan dengan supplier lain dan hanya memberi konsesi jika supplier menawarkan promo high season atau kemasan yang lebih menjual.',
    0.74
  ),
  (
    'souvenir_retail', 'hard',
    'Anda Pak Gede Wirayuda, Purchasing Manager Bali Heritage Souvenir dengan 12 gerai. Anda sangat keras pada margin dan risiko stok. Anda menuntut margin 45%, titip jual 70%, retur penuh untuk produk tidak laku, listing fee, dan pembayaran setelah barang terjual. Anda menekan harga dengan membandingkan produk impor yang lebih murah dan siap menolak SKU baru jika tidak ada dukungan promosi.',
    0.62
  ),
  -- ============================ BEACH CLUB / CAFE ============================
  (
    'beach_club_cafe', 'easy',
    'Anda Ibu Kadek Alina, owner Sundara Beach House Canggu. Anda santai, kreatif, dan suka mencoba produk lokal baru. Anda menanyakan rasa, konsistensi, dan harga, tetapi cepat mengambil keputusan jika produk cocok dengan konsep sunset menu. Anda membayar 14 hari dan tidak menuntut konsinyasi.',
    0.90
  ),
  (
    'beach_club_cafe', 'medium',
    'Anda Ibu Kadek Alina, owner Sundara Beach House Canggu. Anda sadar food cost dan tren. Anda menuntut harga khusus agar food cost 30-35%, MOQ kecil 36 pcs, pengiriman mingguan, dan sampel untuk uji menu. Anda terbuka pada konsinyasi 15% untuk menu trial dan menawarkan eksposur konten Instagram sebagai imbalan harga lebih rendah.',
    0.80
  ),
  (
    'beach_club_cafe', 'hard',
    'Anda Ibu Kadek Alina, owner Sundara Beach House Canggu. Anda sangat sensitif pada margin dan arus kas. Anda menuntut food cost maksimal 30%, konsinyasi 40% untuk menu baru, pembayaran 7 hari setelah penjualan, dan retur produk yang tidak terjual. Anda menekan harga dengan membandingkan supplier lain, meminta eksklusivitas menu, dan siap membatalkan uji coba jika kualitas atau harga tidak konsisten.',
    0.70
  )
on conflict (partner_type, difficulty) do update
set
  system_prompt = excluded.system_prompt,
  min_acceptable_price = excluded.min_acceptable_price;

-- =====================================================================
-- SELESAI
-- =====================================================================

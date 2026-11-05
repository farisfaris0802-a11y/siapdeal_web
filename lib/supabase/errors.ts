export interface DatabaseErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

const MIGRATION_FILE = "supabase/migrations/20260101000000_init.sql";

export function isMissingTableError(error: DatabaseErrorLike | null | undefined) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /could not find the table/i.test(error.message ?? "")
  );
}

export function isMissingColumnError(error: DatabaseErrorLike | null | undefined) {
  if (!error) return false;
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /could not find the .* column/i.test(error.message ?? "")
  );
}

/**
 * Mengubah error PostgREST menjadi pesan yang bisa ditindaklanjuti.
 * Pesan generik "Gagal memuat..." menyulitkan diagnosis ketika migration
 * belum dijalankan, jadi kita tampilkan tabel yang bermasalah.
 */
export function describeDatabaseError(
  error: DatabaseErrorLike,
  table: string,
  actionLabel: string
) {
  if (isMissingTableError(error)) {
    return `Tabel public.${table} belum ada di database. Jalankan migration ${MIGRATION_FILE} di Supabase SQL Editor, lalu refresh halaman ini.`;
  }

  if (isMissingColumnError(error)) {
    return `Struktur tabel public.${table} belum cocok (kolom tidak ditemukan). Jalankan ulang migration ${MIGRATION_FILE} agar kolom terbaru ditambahkan.`;
  }

  if (error.code === "42501") {
    return `Akses ke tabel public.${table} ditolak oleh RLS. Pastikan migration RLS sudah dijalankan dan Anda login sebagai user yang valid.`;
  }

  return `${actionLabel} gagal (${error.code ?? "unknown"}): ${
    error.message ?? "terjadi kesalahan pada database"
  }`;
}

import { createClient } from "@/lib/supabase/server";
import {
  type DatabaseErrorLike,
  isMissingTableError,
} from "@/lib/supabase/errors";

export const REQUIRED_TABLES = [
  "buyer_personas",
  "products",
  "simulation_sessions",
  "messages",
  "evaluations",
] as const;

export interface DatabaseProblem {
  table: string;
  code: string | null;
  message: string;
  missingTable: boolean;
}

export interface DatabaseHealth {
  ok: boolean;
  missingTables: string[];
  problems: DatabaseProblem[];
}

/**
 * Cek ringan (HEAD request) untuk memastikan tabel inti sudah dibuat.
 * Dipakai halaman /simulasi/baru agar pengguna melihat instruksi migration
 * sebelum menekan "Mulai simulasi", bukan error generik setelah submit.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const supabase = createClient();

  const checks = await Promise.all(
    REQUIRED_TABLES.map(async (table) => {
      const { error } = await supabase
        .from(table)
        .select("id", { head: true, count: "exact" })
        .limit(1);

      return { table, error: error as DatabaseErrorLike | null };
    })
  );

  const problems: DatabaseProblem[] = checks
    .filter((check) => Boolean(check.error))
    .map((check) => ({
      table: check.table,
      code: check.error?.code ?? null,
      message: check.error?.message ?? "Tidak dapat mengakses tabel.",
      missingTable: isMissingTableError(check.error),
    }));

  return {
    ok: problems.length === 0,
    missingTables: problems
      .filter((problem) => problem.missingTable)
      .map((problem) => problem.table),
    problems,
  };
}

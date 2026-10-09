import { NextResponse } from "next/server";
import {
  getTurso,
  ensureSchema,
  tursoEnvStatus,
  listTables,
} from "@/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = tursoEnvStatus();
  const turso = getTurso();
  if (!turso) {
    return NextResponse.json({
      ok: false,
      turso: false,
      ...env,
      tables: [],
      message:
        "Turso client not available — set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (Production) and Redeploy",
    });
  }

  try {
    await ensureSchema();
    const tables = await listTables();
    let users = 0;
    if (tables.includes("users")) {
      const r = await turso.execute("SELECT COUNT(*) AS c FROM users");
      users = Number(r.rows[0]?.c ?? 0);
    }
    return NextResponse.json({
      ok: true,
      turso: true,
      ...tursoEnvStatus(),
      tables,
      users,
      message:
        tables.length > 0
          ? "Turso connected; schema ready"
          : "Connected but no tables visible — check you opened the same DB in Turso dashboard",
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      turso: true,
      ...tursoEnvStatus(),
      tables: [],
      error: String(e?.message || e).slice(0, 240),
      message: "Schema/query failed — token may lack write permission or URL is wrong",
    });
  }
}

export async function POST() {
  return GET();
}

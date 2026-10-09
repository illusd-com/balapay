import { NextResponse } from "next/server";
import { getTurso, ensureSchema } from "@/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasUrl = Boolean(
    process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || process.env.DATABASE_URL
  );
  const hasToken = Boolean(
    process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
  );

  const turso = getTurso();
  if (!turso) {
    return NextResponse.json({
      ok: false,
      turso: false,
      hasUrl,
      hasToken,
      message: "Turso client not available — check env vars on Vercel",
    });
  }

  try {
    await ensureSchema();
    const r = await turso.execute("SELECT COUNT(*) AS c FROM users");
    const count = Number(r.rows[0]?.c ?? 0);
    return NextResponse.json({
      ok: true,
      turso: true,
      hasUrl,
      hasToken,
      users: count,
      message: "Turso connected",
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      turso: true,
      hasUrl,
      hasToken,
      error: String(e?.message || e).slice(0, 200),
      message: "Turso client created but query failed",
    });
  }
}

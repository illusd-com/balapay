import { NextResponse } from "next/server";
import { getTurso, ensureSchema, tursoEnvStatus } from "@/lib/turso";

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
      message:
        "Turso client not available — set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN on Vercel (Production) and Redeploy",
    });
  }

  try {
    await ensureSchema();
    const r = await turso.execute("SELECT COUNT(*) AS c FROM users");
    const count = Number(r.rows[0]?.c ?? 0);
    return NextResponse.json({
      ok: true,
      turso: true,
      ...env,
      users: count,
      message: "Turso connected",
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      turso: true,
      ...env,
      error: String(e?.message || e).slice(0, 200),
      message: "Turso client created but query failed — check token permissions / URL",
    });
  }
}

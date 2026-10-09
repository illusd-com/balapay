import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    let is_verified = user.is_verified;
    let name = user.name;
    let balance = user.balance;
    const turso = getTurso();
    if (turso) {
      try {
        const r = await turso.execute({
          sql: "SELECT name, balance, is_verified FROM users WHERE id = ?",
          args: [user.id],
        });
        if (r.rows.length > 0) {
          is_verified = Number(r.rows[0].is_verified) === 1;
          name = (r.rows[0].name as string) || name;
          balance = Number(r.rows[0].balance) || 0;
        }
      } catch (e) {
        console.error("[me] turso", e);
      }
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name,
      balance,
      is_verified,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "讀取失敗" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ cards: [] });
    }
    const res = await turso.execute({
      sql: `SELECT card_id, belong_email, status, label, issued_at
            FROM nfc_cards WHERE user_id = ?
            ORDER BY issued_at DESC`,
      args: [session.id],
    });
    return NextResponse.json({
      cards: res.rows.map((r) => ({
        card_id: r.card_id,
        belong_email: r.belong_email,
        status: r.status,
        label: r.label,
        issued_at: r.issued_at,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

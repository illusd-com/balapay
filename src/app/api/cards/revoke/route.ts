import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const cardId = String(body.cardId || "").trim();
    if (!cardId) {
      return NextResponse.json({ error: "缺少 cardId" }, { status: 400 });
    }
    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線" }, { status: 503 });
    }
    await turso.execute({
      sql: `UPDATE nfc_cards SET status = 'lost', updated_at = datetime('now')
            WHERE card_id = ? AND user_id = ?`,
      args: [cardId, session.id],
    });
    return NextResponse.json({ success: true, message: "已掛失" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

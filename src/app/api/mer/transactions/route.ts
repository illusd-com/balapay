import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getTurso } from "@/lib/turso";
import { authMerchantApi, getMerchantByUser } from "@/lib/merchant";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const merId = req.headers.get("x-mer-id") || "";
    const apiKey = req.headers.get("x-api-key") || "";

    let mer = null;
    if (merId && apiKey) {
      mer = await authMerchantApi(merId, apiKey);
    } else {
      const session = await getSession();
      if (session) mer = await getMerchantByUser(session.id);
    }
    if (!mer) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ transactions: [] });
    }

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "30", 10), 100);
    const res = await turso.execute({
      sql: `SELECT id, type, amount, counterpart, note, status, created_at
            FROM transactions WHERE user_id = ?
            ORDER BY created_at DESC LIMIT ?`,
      args: [mer.user_id, limit],
    });

    return NextResponse.json({
      transactions: res.rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        counterpart: r.counterpart,
        note: r.note,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

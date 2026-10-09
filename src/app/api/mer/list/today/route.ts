import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getTurso } from "@/lib/turso";
import { authMerchantApi, getMerchantByUser } from "@/lib/merchant";
import { getSession } from "@/lib/auth";

async function resolveMerchant(req: NextRequest) {
  const merId = req.headers.get("x-mer-id") || "";
  const apiKey = req.headers.get("x-api-key") || "";
  if (merId && apiKey) return authMerchantApi(merId, apiKey);
  const session = await getSession();
  if (session) return getMerchantByUser(session.id);
  return null;
}

/** GET /api/mer/list/today — 今日交易（UTC+8 日界） */
export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const mer = await resolveMerchant(req);
    if (!mer) {
      return NextResponse.json({ error: "未授權：請提供 X-Mer-Id / X-Api-Key 或登入" }, { status: 401 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ date: null, count: 0, total_in: 0, total_out: 0, transactions: [] });
    }

    const res = await turso.execute({
      sql: `SELECT id, type, amount, counterpart, note, status, created_at
            FROM transactions
            WHERE user_id = ?
              AND date(created_at, '+8 hours') = date('now', '+8 hours')
            ORDER BY created_at DESC`,
      args: [mer.user_id],
    });

    const transactions = res.rows.map((r) => ({
      id: r.id as string,
      type: r.type as string,
      amount: Number(r.amount),
      counterpart: r.counterpart as string,
      note: r.note as string,
      status: r.status as string,
      created_at: r.created_at as string,
    }));

    let total_in = 0;
    let total_out = 0;
    for (const t of transactions) {
      if (t.amount >= 0) total_in += t.amount;
      else total_out += Math.abs(t.amount);
    }

    return NextResponse.json({
      date: new Date().toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" }),
      count: transactions.length,
      total_in: Math.round(total_in * 100) / 100,
      total_out: Math.round(total_out * 100) / 100,
      transactions,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

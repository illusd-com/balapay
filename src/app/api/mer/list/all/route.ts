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

/** GET /api/mer/list/all?limit=50&offset=0 */
export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const mer = await resolveMerchant(req);
    if (!mer) {
      return NextResponse.json({ error: "未授權：請提供 X-Mer-Id / X-Api-Key 或登入" }, { status: 401 });
    }

    const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "50", 10) || 50, 1), 200);
    const offset = Math.max(parseInt(req.nextUrl.searchParams.get("offset") || "0", 10) || 0, 0);

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ count: 0, limit, offset, transactions: [] });
    }

    const countRes = await turso.execute({
      sql: "SELECT COUNT(*) as c FROM transactions WHERE user_id = ?",
      args: [mer.user_id],
    });
    const total = Number(countRes.rows[0]?.c) || 0;

    const res = await turso.execute({
      sql: `SELECT id, type, amount, counterpart, note, status, created_at
            FROM transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
      args: [mer.user_id, limit, offset],
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

    return NextResponse.json({
      total,
      count: transactions.length,
      limit,
      offset,
      transactions,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

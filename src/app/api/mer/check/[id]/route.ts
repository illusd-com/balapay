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

/** GET /api/mer/check/{id} */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const mer = await resolveMerchant(req);
    if (!mer) {
      return NextResponse.json({ error: "未授權：請提供 X-Mer-Id / X-Api-Key 或登入" }, { status: 401 });
    }

    const { id: rawId } = await ctx.params;
    const id = decodeURIComponent(rawId || "").replace(/^id=/, "").trim();
    if (!id) {
      return NextResponse.json({ error: "缺少交易 id" }, { status: 400 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線" }, { status: 503 });
    }

    const res = await turso.execute({
      sql: `SELECT id, user_id, type, amount, counterpart, note, status, created_at
            FROM transactions
            WHERE id = ? AND user_id = ?
            LIMIT 1`,
      args: [id, mer.user_id],
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "找不到此交易，或無權限查看" }, { status: 404 });
    }

    const r = res.rows[0];
    return NextResponse.json({
      found: true,
      transaction: {
        id: r.id as string,
        type: r.type as string,
        amount: Number(r.amount),
        counterpart: r.counterpart as string,
        note: r.note as string,
        status: r.status as string,
        created_at: r.created_at as string,
        direction: Number(r.amount) >= 0 ? "in" : "out",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

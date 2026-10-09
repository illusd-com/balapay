import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";
import { authMerchantApi, getMerchantByUser } from "@/lib/merchant";

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
      if (!session) {
        return NextResponse.json({ error: "請先登入或提供 X-Mer-Id / X-Api-Key" }, { status: 401 });
      }
      mer = await getMerchantByUser(session.id);
      if (!mer) {
        return NextResponse.json({ activated: false, merchant: null });
      }
    }
    if (!mer) {
      return NextResponse.json({ error: "商家驗證失敗" }, { status: 401 });
    }

    const turso = getTurso();
    let balance = 0;
    let email = "";
    if (turso) {
      const u = await turso.execute({
        sql: "SELECT email, balance FROM users WHERE id = ?",
        args: [mer.user_id],
      });
      if (u.rows.length) {
        email = u.rows[0].email as string;
        balance = Number(u.rows[0].balance) || 0;
      }
    }

    return NextResponse.json({
      activated: true,
      merchant: {
        mer_id: mer.mer_id,
        shop_name: mer.shop_name,
        email,
        balance,
        api_key_hint: mer.api_key.slice(0, 12) + "…" + mer.api_key.slice(-4),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

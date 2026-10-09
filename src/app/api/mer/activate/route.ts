import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";
import { activateMerchant } from "@/lib/merchant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json(
        {
          error:
            "資料庫未連線，無法啟用商家。請確認 Vercel 已設定 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const shopName = String(body.shopName || session.name || "我的商店").slice(0, 80);

    const mer = await activateMerchant(session.id, shopName, session.email);

    return NextResponse.json({
      success: true,
      mer_id: mer.mer_id,
      api_key: mer.api_key,
      shop_name: mer.shop_name,
      message: "商家已啟用。請妥善保存 api_key（完整金鑰僅此時顯示）。",
    });
  } catch (e: any) {
    console.error("[mer/activate]", e);
    return NextResponse.json({ error: e?.message || "啟用失敗" }, { status: 400 });
  }
}

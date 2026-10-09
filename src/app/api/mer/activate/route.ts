import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";
import { activateMerchant } from "@/lib/merchant";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const shopName = String(body.shopName || session.name || "我的商店").slice(0, 80);
    const mer = await activateMerchant(session.id, shopName);
    return NextResponse.json({
      success: true,
      mer_id: mer.mer_id,
      api_key: mer.api_key,
      shop_name: mer.shop_name,
      message: "商家已啟用。請妥善保存 api_key。",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "啟用失敗" }, { status: 400 });
  }
}

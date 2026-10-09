import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getTurso } from "@/lib/turso";
import { authMerchantApi, getMerchantByUser, buildQrPayload } from "@/lib/merchant";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const item = String(body.item || "商品").slice(0, 80);
    const qty = Math.max(1, parseInt(body.qty || "1", 10) || 1);
    let unitPrice = parseFloat(body.unitPrice || body.amount || "0");
    let amount = parseFloat(body.amount || "0");
    if (!(amount > 0) && unitPrice > 0) amount = Math.round(unitPrice * qty * 100) / 100;
    if (!(unitPrice > 0) && amount > 0) unitPrice = amount;
    if (!(amount > 0)) {
      return NextResponse.json({ error: "金額無效" }, { status: 400 });
    }

    let email = "";
    const turso = getTurso();
    if (turso) {
      const u = await turso.execute({
        sql: "SELECT email FROM users WHERE id = ?",
        args: [mer.user_id],
      });
      email = (u.rows[0]?.email as string) || "";
    }

    const payload = buildQrPayload({
      email,
      amount,
      item,
      qty,
      unitPrice,
      shopName: mer.shop_name,
    });

    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;

    return NextResponse.json({
      success: true,
      payload,
      amount,
      item,
      qty,
      shop_name: mer.shop_name,
      qr_image_url: qrImage,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

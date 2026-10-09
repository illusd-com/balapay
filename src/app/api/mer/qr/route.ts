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
    let sessionEmail = "";
    if (merId && apiKey) {
      mer = await authMerchantApi(merId, apiKey);
    } else {
      const session = await getSession();
      if (session) {
        mer = await getMerchantByUser(session.id);
        sessionEmail = session.email || "";
      }
    }
    if (!mer) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await req.json();
    const item = String(body.item || body.itemwhat || "商品").trim().slice(0, 80);
    const qty = Math.max(1, parseInt(String(body.qty ?? body.itemhowmany ?? "1"), 10) || 1);
    let unitPrice = parseFloat(String(body.unitPrice ?? body.itemhowmuch1 ?? "0"));
    let amount = parseFloat(String(body.amount ?? body.payhow ?? "0"));
    if (!(amount > 0) && unitPrice > 0) {
      amount = Math.round(unitPrice * qty * 100) / 100;
    }
    if (!(unitPrice > 0) && amount > 0) {
      unitPrice = Math.round((amount / qty) * 100) / 100;
    }
    if (!(amount > 0)) {
      return NextResponse.json({ error: "請填寫有效金額（payhow 或 itemhowmuch1）" }, { status: 400 });
    }

    const shopName = String(body.shopName || body.mername || mer.shop_name || "商店")
      .trim()
      .slice(0, 80);

    let email = String(body.paywho || "").trim().toLowerCase();
    if (!email) {
      const turso = getTurso();
      if (turso) {
        const u = await turso.execute({
          sql: "SELECT email FROM users WHERE id = ?",
          args: [mer.user_id],
        });
        email = ((u.rows[0]?.email as string) || "").toLowerCase();
      }
      if (!email) email = sessionEmail.toLowerCase();
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "無法取得商家 Email（paywho），請確認帳戶已綁定電子郵件" },
        { status: 400 }
      );
    }

    const payload = buildQrPayload({
      email,
      amount,
      item,
      qty,
      unitPrice,
      shopName,
    });

    const fields = {
      paywho: email,
      payhow: amount,
      itemhowmany: qty,
      itemhowmuch1: unitPrice,
      itemwhat: item,
      mername: shopName,
    };

    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(payload)}`;

    return NextResponse.json({
      success: true,
      payload,
      fields,
      amount,
      item,
      qty,
      unitPrice,
      shop_name: shopName,
      qr_image_url: qrImage,
    });
  } catch (e: any) {
    console.error("[mer/qr]", e);
    return NextResponse.json({ error: e.message || "失敗" }, { status: 400 });
  }
}

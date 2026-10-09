import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getTurso } from "@/lib/turso";
import { authMerchantApi } from "@/lib/merchant";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const merId = req.headers.get("x-mer-id") || "";
    const apiKey = req.headers.get("x-api-key") || "";
    const mer = await authMerchantApi(merId, apiKey);
    if (!mer) {
      return NextResponse.json({ error: "無效的 mer-id 或 api_key" }, { status: 401 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線，無法收款" }, { status: 503 });
    }

    {
      const v = await turso.execute({
        sql: "SELECT is_verified FROM users WHERE id = ?",
        args: [mer.user_id],
      });
      if (!v.rows.length || !Number(v.rows[0].is_verified)) {
        return NextResponse.json(
          { error: "商家尚未完成實名驗證，無法收款" },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const payerEmail = String(body.payerEmail || body.paywho || "")
      .toLowerCase()
      .trim();
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.payhow === "number"
          ? body.payhow
          : parseFloat(body.amount ?? body.payhow);
    const item = String(body.item || body.itemwhat || "商品").slice(0, 80);
    const qtyRaw = body.qty ?? body.itemhowmany ?? 1;
    const qty = typeof qtyRaw === "number" ? qtyRaw : parseInt(String(qtyRaw), 10) || 1;
    const unitPriceRaw = body.unitPrice ?? body.itemhowmuch1;
    const unitPrice =
      unitPriceRaw !== undefined && unitPriceRaw !== null && unitPriceRaw !== ""
        ? typeof unitPriceRaw === "number"
          ? unitPriceRaw
          : parseFloat(String(unitPriceRaw))
        : amount / Math.max(qty, 1);
    const mername = String(body.mername || mer.shop_name || "").slice(0, 80);
    const note = String(
      body.note || `商家收款｜${mername}｜${item} x${qty}`
    ).slice(0, 200);

    if (!payerEmail.includes("@")) {
      return NextResponse.json(
        { error: "請提供有效的 payerEmail（付款人 BalaPAY 電子郵件）" },
        { status: 400 }
      );
    }
    if (!(amount > 0) || isNaN(amount) || amount > 1_000_000) {
      return NextResponse.json({ error: "amount 金額無效（需 > 0）" }, { status: 400 });
    }

    const merUser = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE id = ?",
      args: [mer.user_id],
    });
    if (!merUser.rows.length) {
      return NextResponse.json({ error: "商家帳戶不存在" }, { status: 404 });
    }
    const merEmail = (merUser.rows[0].email as string).toLowerCase();
    if (payerEmail === merEmail) {
      return NextResponse.json({ error: "無法向自己收款" }, { status: 400 });
    }

    const payer = await turso.execute({
      sql: "SELECT id, email, balance, is_verified FROM users WHERE email = ? OR lower(email) = ?",
      args: [payerEmail, payerEmail],
    });
    if (!payer.rows.length) {
      return NextResponse.json(
        { error: "付款人不存在（需已註冊 BalaPAY）", Enough_money: false },
        { status: 404 }
      );
    }
    if (!Number(payer.rows[0].is_verified)) {
      return NextResponse.json(
        { error: "付款人尚未完成實名驗證" },
        { status: 403 }
      );
    }

    const payerBal = Number(payer.rows[0].balance) || 0;
    if (payerBal < amount) {
      return NextResponse.json(
        {
          success: false,
          "Enough money": false,
          "Remaining amount": payerBal,
          Enough_money: false,
          Remaining_amount: payerBal,
          message: `Enough money=false  Remaining amount=${payerBal}`,
          error: `Enough money=false  Remaining amount=${payerBal}`,
          required: amount,
          payerEmail,
        },
        { status: 400 }
      );
    }

    const payerId = payer.rows[0].id as string;
    const merBal = Number(merUser.rows[0].balance) || 0;
    const newPayer = Math.round((payerBal - amount) * 100) / 100;
    const newMer = Math.round((merBal + amount) * 100) / 100;
    const outId = uuidv4();
    const inId = uuidv4();

    await turso.batch(
      [
        {
          sql: "UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?",
          args: [newPayer, payerId, amount],
        },
        {
          sql: "UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?",
          args: [newMer, mer.user_id],
        },
        {
          sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
                VALUES (?, ?, 'transfer_out', ?, ?, ?, 'completed')`,
          args: [outId, payerId, -amount, merEmail, note],
        },
        {
          sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
                VALUES (?, ?, 'transfer_in', ?, ?, ?, 'completed')`,
          args: [inId, mer.user_id, amount, payerEmail, note],
        },
      ],
      "write"
    );

    return NextResponse.json({
      success: true,
      "Enough money": true,
      Enough_money: true,
      charge_id: inId,
      amount,
      payerEmail,
      item,
      qty,
      unitPrice,
      mername,
      note,
      payer_balance: newPayer,
      merchant_balance: newMer,
      message: "收款成功（即時扣款完成）",
    });
  } catch (e: any) {
    console.error("[mer/charge]", e);
    return NextResponse.json({ error: e.message || "收款失敗" }, { status: 400 });
  }
}

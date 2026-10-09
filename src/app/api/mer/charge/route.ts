import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getTurso } from "@/lib/turso";
import { authMerchantApi } from "@/lib/merchant";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const merId = req.headers.get("x-mer-id") || "";
    const apiKey = req.headers.get("x-api-key") || "";
    const mer = await authMerchantApi(merId, apiKey);
    if (!mer) {
      return NextResponse.json({ error: "無效的 mer-id 或 api_key" }, { status: 401 });
    }

    const body = await req.json();
    const payerEmail = String(body.payerEmail || "").toLowerCase().trim();
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount);
    const item = String(body.item || "商品").slice(0, 80);
    const note = String(body.note || `商家收款｜${mer.shop_name}｜${item}`).slice(0, 200);

    if (!payerEmail.includes("@")) {
      return NextResponse.json({ error: "payerEmail 無效" }, { status: 400 });
    }
    if (!(amount > 0) || amount > 1_000_000) {
      return NextResponse.json({ error: "金額無效" }, { status: 400 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線，無法收款" }, { status: 503 });
    }

    const merUser = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE id = ?",
      args: [mer.user_id],
    });
    if (!merUser.rows.length) {
      return NextResponse.json({ error: "商家帳戶不存在" }, { status: 404 });
    }
    const merEmail = merUser.rows[0].email as string;
    if (payerEmail === merEmail.toLowerCase()) {
      return NextResponse.json({ error: "無法向自己收款" }, { status: 400 });
    }

    const payer = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE email = ?",
      args: [payerEmail],
    });
    if (!payer.rows.length) {
      return NextResponse.json({ error: "付款人不存在（需已註冊 BalaPAY）" }, { status: 404 });
    }
    const payerBal = Number(payer.rows[0].balance) || 0;
    if (payerBal < amount) {
      return NextResponse.json({ error: `付款人餘額不足（目前 ${payerBal}）` }, { status: 400 });
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
      charge_id: inId,
      amount,
      payerEmail,
      merchant_balance: newMer,
      message: "收款成功",
    });
  } catch (e: any) {
    console.error("[mer/charge]", e);
    return NextResponse.json({ error: e.message || "收款失敗" }, { status: 400 });
  }
}

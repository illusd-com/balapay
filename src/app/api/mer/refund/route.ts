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
    const note = String(body.note || `商家退款｜${mer.shop_name}`).slice(0, 200);

    if (!payerEmail.includes("@") || !(amount > 0)) {
      return NextResponse.json({ error: "參數無效" }, { status: 400 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線" }, { status: 503 });
    }

    const merUser = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE id = ?",
      args: [mer.user_id],
    });
    if (!merUser.rows.length) {
      return NextResponse.json({ error: "商家帳戶不存在" }, { status: 404 });
    }
    const merBal = Number(merUser.rows[0].balance) || 0;
    if (merBal < amount) {
      return NextResponse.json({ error: `商家餘額不足，無法退款（目前 ${merBal}）` }, { status: 400 });
    }
    const merEmail = merUser.rows[0].email as string;

    const payer = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE email = ?",
      args: [payerEmail],
    });
    if (!payer.rows.length) {
      return NextResponse.json({ error: "退款對象不存在" }, { status: 404 });
    }

    const payerId = payer.rows[0].id as string;
    const payerBal = Number(payer.rows[0].balance) || 0;
    const newMer = Math.round((merBal - amount) * 100) / 100;
    const newPayer = Math.round((payerBal + amount) * 100) / 100;
    const outId = uuidv4();
    const inId = uuidv4();

    await turso.batch(
      [
        {
          sql: "UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?",
          args: [newMer, mer.user_id, amount],
        },
        {
          sql: "UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?",
          args: [newPayer, payerId],
        },
        {
          sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
                VALUES (?, ?, 'transfer_out', ?, ?, ?, 'completed')`,
          args: [outId, mer.user_id, -amount, payerEmail, note],
        },
        {
          sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
                VALUES (?, ?, 'transfer_in', ?, ?, ?, 'completed')`,
          args: [inId, payerId, amount, merEmail, note],
        },
      ],
      "write"
    );

    return NextResponse.json({
      success: true,
      refund_id: outId,
      amount,
      payerEmail,
      merchant_balance: newMer,
      message: "退款成功",
    });
  } catch (e: any) {
    console.error("[mer/refund]", e);
    return NextResponse.json({ error: e.message || "退款失敗" }, { status: 400 });
  }
}

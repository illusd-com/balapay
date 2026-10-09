import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTurso, ensureSchema } from "@/lib/turso";
import { demoTransfer } from "@/lib/store";
import { parseQrPay, buildPaymentNote } from "@/lib/qrpay";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    if (!session.is_verified) {
      return NextResponse.json({ error: "請先至「我的」完成實名驗證，才能進行收付款" }, { status: 403 });
    }

    const body = await req.json();
    let payload;

    if (body.qr) {
      const parsed = parseQrPay(String(body.qr));
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      payload = parsed.data;
    } else if (body.paywho) {
      const parsed = parseQrPay(
        [
          `paywho=${body.paywho}`,
          `payhow=${body.payhow}`,
          `itemhowmany=${body.itemhowmany ?? 1}`,
          `itemhowmuch1=${body.itemhowmuch1 ?? body.payhow}`,
          `itemwhat=${body.itemwhat ?? "商品"}`,
          `mername=${body.mername ?? ""}`,
        ].join("&")
      );
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      payload = parsed.data;
    } else {
      return NextResponse.json({ error: "請提供 QR 內容或付款參數" }, { status: 400 });
    }

    const toEmail = payload.paywho;
    const num = payload.payhow;
    const note = buildPaymentNote(payload);

    if (toEmail === session.email.toLowerCase()) {
      return NextResponse.json({ error: "無法付款給自己" }, { status: 400 });
    }

    const turso = getTurso();

    if (!turso) {
      const result = demoTransfer({
        fromUserId: session.id,
        toEmail,
        amount: num,
        note,
      });
      return NextResponse.json({
        success: true,
        message: `已付款 ${num} BLA 給 ${payload.mername}`,
        fromBalance: result.fromBalance,
        toEmail: result.toEmail,
        amount: result.amount,
        received: true,
        merchant: payload.mername,
        item: payload.itemwhat,
        qty: payload.itemhowmany,
      });
    }

    const senderRes = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE id = ?",
      args: [session.id],
    });
    if (senderRes.rows.length === 0) {
      return NextResponse.json({ error: "帳戶不存在，請重新登入" }, { status: 404 });
    }
    const senderBalance = Number(senderRes.rows[0].balance) || 0;
    if (senderBalance < num) {
      return NextResponse.json(
        { error: `餘額不足（目前 ${senderBalance} BLA，需 ${num} BLA）` },
        { status: 400 }
      );
    }

    const recipientRes = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE email = ?",
      args: [toEmail],
    });
    const recipientId =
      recipientRes.rows.length > 0 ? (recipientRes.rows[0].id as string) : null;

    const outId = uuidv4();
    const inId = uuidv4();
    const newSenderBal = Math.round((senderBalance - num) * 100) / 100;

    const statements: { sql: string; args: any[] }[] = [
      {
        sql: "UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?",
        args: [newSenderBal, session.id, num],
      },
      {
        sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
              VALUES (?, ?, 'transfer_out', ?, ?, ?, 'completed')`,
        args: [outId, session.id, -num, toEmail, note],
      },
    ];

    if (recipientId) {
      const recipBal = Number(recipientRes.rows[0].balance) || 0;
      const newRecipBal = Math.round((recipBal + num) * 100) / 100;
      statements.push({
        sql: "UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?",
        args: [newRecipBal, recipientId],
      });
      statements.push({
        sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
              VALUES (?, ?, 'transfer_in', ?, ?, ?, 'completed')`,
        args: [inId, recipientId, num, session.email, note],
      });
    }

    await turso.batch(statements, "write");

    return NextResponse.json({
      success: true,
      message: recipientId
        ? `已付款 ${num} BLA 給 ${payload.mername}，商家已入帳`
        : `已付款 ${num} BLA（商家尚未註冊 BalaPAY，待開戶後可對帳）`,
      fromBalance: newSenderBal,
      toEmail,
      amount: num,
      received: Boolean(recipientId),
      merchant: payload.mername,
      item: payload.itemwhat,
      qty: payload.itemhowmany,
    });
  } catch (e: any) {
    console.error("[pay]", e);
    return NextResponse.json({ error: e.message || "付款失敗" }, { status: 400 });
  }
}

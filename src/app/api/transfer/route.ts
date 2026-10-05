import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTurso, ensureSchema } from "@/lib/turso";
import { demoTransfer } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await req.json();
    const toEmail = String(body.toEmail || "")
      .toLowerCase()
      .trim();
    const num =
      typeof body.amount === "number" ? body.amount : parseFloat(body.amount);
    const note = String(body.note || "").slice(0, 200);

    if (!toEmail || !toEmail.includes("@")) {
      return NextResponse.json({ error: "請輸入有效的收款人 Email" }, { status: 400 });
    }
    if (isNaN(num) || num <= 0) {
      return NextResponse.json({ error: "請輸入有效金額" }, { status: 400 });
    }
    if (num > 1_000_000) {
      return NextResponse.json({ error: "單筆轉帳上限 1,000,000 BLA" }, { status: 400 });
    }
    if (toEmail === session.email.toLowerCase()) {
      return NextResponse.json({ error: "無法轉帳給自己" }, { status: 400 });
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
        message: `已成功轉出 ${num} BLA 給 ${result.toEmail}，對方已入帳`,
        fromBalance: result.fromBalance,
        toEmail: result.toEmail,
        amount: result.amount,
        received: true,
      });
    }

    const senderRes = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE id = ?",
      args: [session.id],
    });
    if (senderRes.rows.length === 0) {
      return NextResponse.json({ error: "帳戶不存在" }, { status: 404 });
    }
    const senderBalance = Number(senderRes.rows[0].balance) || 0;
    if (senderBalance < num) {
      return NextResponse.json({ error: "餘額不足" }, { status: 400 });
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
        ? `已成功轉出 ${num} BLA，對方已入帳`
        : `已成功轉出 ${num} BLA（收款人尚未註冊，款項將於對方開戶後可對帳）`,
      fromBalance: newSenderBal,
      toEmail,
      amount: num,
      received: Boolean(recipientId),
    });
  } catch (e: any) {
    console.error("[transfer]", e);
    return NextResponse.json({ error: e.message || "轉帳失敗" }, { status: 400 });
  }
}

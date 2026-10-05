import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTurso, ensureSchema } from "@/lib/turso";
import { demoTransfer } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { toEmail, amount, note } = await req.json();
    const num = typeof amount === "number" ? amount : parseFloat(amount);

    if (!toEmail || typeof toEmail !== "string") {
      return NextResponse.json({ error: "請輸入收款人 Email" }, { status: 400 });
    }
    if (isNaN(num) || num <= 0) {
      return NextResponse.json({ error: "請輸入有效金額" }, { status: 400 });
    }
    if (num > 1000000) {
      return NextResponse.json({ error: "單筆轉帳上限 1,000,000 BLA" }, { status: 400 });
    }

    const turso = getTurso();

    if (!turso) {
      const result = demoTransfer({
        fromUserId: session.id,
        toEmail: toEmail.toLowerCase().trim(),
        amount: num,
        note: note || "",
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

    await ensureSchema();

    if (session.balance < num) {
      return NextResponse.json({ error: "餘額不足" }, { status: 400 });
    }
    if (toEmail.toLowerCase() === session.email.toLowerCase()) {
      return NextResponse.json({ error: "無法轉帳給自己" }, { status: 400 });
    }

    const recipientRes = await turso.execute({
      sql: "SELECT id, email, balance FROM users WHERE email = ?",
      args: [toEmail.toLowerCase().trim()],
    });

    let recipientId: string | null = null;
    if (recipientRes.rows.length > 0) {
      recipientId = recipientRes.rows[0].id as string;
    }

    await turso.execute({
      sql: "UPDATE users SET balance = balance - ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?",
      args: [num, session.id, num],
    });

    const outId = uuidv4();
    await turso.execute({
      sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
            VALUES (?, ?, 'transfer_out', ?, ?, ?, 'completed')`,
      args: [outId, session.id, -num, toEmail.toLowerCase().trim(), note || ""],
    });

    if (recipientId) {
      await turso.execute({
        sql: "UPDATE users SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?",
        args: [num, recipientId],
      });
      const inId = uuidv4();
      await turso.execute({
        sql: `INSERT INTO transactions (id, user_id, type, amount, counterpart, note, status)
              VALUES (?, ?, 'transfer_in', ?, ?, ?, 'completed')`,
        args: [inId, recipientId, num, session.email, note || ""],
      });
    }

    const balRes = await turso.execute({
      sql: "SELECT balance FROM users WHERE id = ?",
      args: [session.id],
    });
    const fromBalance = (balRes.rows[0]?.balance as number) ?? session.balance - num;

    return NextResponse.json({
      success: true,
      message: recipientId
        ? `已成功轉出 ${num} BLA，對方已入帳`
        : `已成功轉出 ${num} BLA（收款人尚未註冊，款項將於對方開戶後入帳）`,
      fromBalance,
      toEmail: toEmail.toLowerCase().trim(),
      amount: num,
      received: Boolean(recipientId),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "轉帳失敗" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSession, createToken, attachSessionCookie } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";
import { checkBlagovId, namesMatch } from "@/lib/blagov";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const idNumber = String(body.idNumber || "").trim();
    const password = String(body.password || "");

    if (session.is_verified) {
      try {
        const token = await createToken(session.id, {
          email: session.email,
          name: session.name,
          is_verified: true,
        });
        const res = NextResponse.json({
          success: true,
          message: "已完成實名驗證",
          name: session.name,
          is_verified: true,
        });
        return attachSessionCookie(res, token);
      } catch {
        return NextResponse.json({
          success: true,
          message: "已完成實名驗證",
          name: session.name,
          is_verified: true,
        });
      }
    }

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "請輸入真實姓名（至少 2 個字）" }, { status: 400 });
    }
    if (!idNumber || idNumber.length < 8) {
      return NextResponse.json({ error: "請輸入有效身分證字號" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "請輸入 e政府驗證密碼" }, { status: 400 });
    }

    const blagov = await checkBlagovId(idNumber, password);
    if (!blagov.ok) {
      return NextResponse.json({ error: blagov.reason || "身分驗證失敗" }, { status: 400 });
    }
    if (!namesMatch(name, blagov.name)) {
      return NextResponse.json(
        { error: `姓名與 e政府登記不符（登記：${blagov.name}）` },
        { status: 400 }
      );
    }

    const verifiedName = blagov.name.trim();
    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線，無法寫入驗證狀態" }, { status: 503 });
    }

    let userId = session.id;
    const byId = await turso.execute({
      sql: "SELECT id FROM users WHERE id = ?",
      args: [session.id],
    });
    if (byId.rows.length === 0 && session.email) {
      const byEmail = await turso.execute({
        sql: "SELECT id FROM users WHERE lower(email) = ?",
        args: [session.email.toLowerCase()],
      });
      if (byEmail.rows.length > 0) {
        userId = byEmail.rows[0].id as string;
      } else {
        return NextResponse.json(
          { error: "找不到帳戶資料，請登出後重新登入再驗證" },
          { status: 400 }
        );
      }
    }

    await turso.execute({
      sql: `UPDATE users SET name = ?, is_verified = 1, updated_at = datetime('now') WHERE id = ?`,
      args: [verifiedName, userId],
    });

    const check = await turso.execute({
      sql: "SELECT is_verified, name FROM users WHERE id = ?",
      args: [userId],
    });

    if (check.rows.length === 0) {
      return NextResponse.json(
        { error: "驗證寫入後找不到帳戶，請重新登入" },
        { status: 400 }
      );
    }

    if (Number(check.rows[0].is_verified) !== 1) {
      await turso.execute({
        sql: `UPDATE users SET is_verified = 1, name = ? WHERE id = ?`,
        args: [verifiedName, userId],
      });
      const check2 = await turso.execute({
        sql: "SELECT is_verified FROM users WHERE id = ?",
        args: [userId],
      });
      if (!check2.rows.length || Number(check2.rows[0].is_verified) !== 1) {
        return NextResponse.json(
          { error: "資料庫無法標記實名狀態，請確認 Turso 連線" },
          { status: 400 }
        );
      }
    }

    try {
      const token = await createToken(userId, {
        email: session.email,
        name: verifiedName,
        is_verified: true,
      });
      const res = NextResponse.json({
        success: true,
        name: verifiedName,
        is_verified: true,
        message: "實名驗證成功。現在可以收付款。",
      });
      return attachSessionCookie(res, token);
    } catch (tokenErr: any) {
      console.error("[verify] token", tokenErr);
      return NextResponse.json({
        success: true,
        name: verifiedName,
        is_verified: true,
        message: "實名驗證成功（請重新登入以重整登入狀態）。",
      });
    }
  } catch (e: any) {
    console.error("[verify]", e);
    return NextResponse.json(
      { error: e?.message || "驗證失敗，請稍後再試" },
      { status: 400 }
    );
  }
}

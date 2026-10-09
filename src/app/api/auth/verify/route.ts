import { NextRequest, NextResponse } from "next/server";
import { getSession, createToken, attachSessionCookie } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";
import { checkBlagovId, namesMatch } from "@/lib/blagov";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const idNumber = String(body.idNumber || "").trim();
    const password = String(body.password || "");

    if (session.is_verified) {
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

    await turso.execute({
      sql: `UPDATE users SET name = ?, is_verified = 1, updated_at = datetime('now') WHERE id = ?`,
      args: [verifiedName, session.id],
    });

    const check = await turso.execute({
      sql: "SELECT is_verified, name FROM users WHERE id = ?",
      args: [session.id],
    });
    const ok = check.rows.length > 0 && Number(check.rows[0].is_verified) === 1;
    if (!ok) {
      return NextResponse.json({ error: "驗證寫入失敗，請重試" }, { status: 500 });
    }

    const token = await createToken(session.id, {
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
  } catch (e: any) {
    console.error("[verify]", e);
    return NextResponse.json({ error: e.message || "驗證失敗" }, { status: 400 });
  }
}

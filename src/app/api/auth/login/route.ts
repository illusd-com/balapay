import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken, attachSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ error: "請輸入電子郵件與密碼" }, { status: 400 });
    }
    const user = await loginUser(email, password);
    const token = await createToken(user.id, {
      email: user.email,
      name: user.name,
    });
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
    return attachSessionCookie(res, token);
  } catch (e: any) {
    console.error("[login]", e?.message || e);
    const msg = e?.message || "登入失敗";
    const status = msg.includes("資料庫") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

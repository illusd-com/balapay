import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken, setSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "請輸入電子郵件與密碼" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密碼至少需要 6 個字元" }, { status: 400 });
    }
    const user = await registerUser(email, password, name);
    const token = await createToken(user.id);
    await setSessionCookie(token);
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "註冊失敗" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken, attachSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password } = await req.json();
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
    return NextResponse.json({ error: e.message || "登入失敗" }, { status: 401 });
  }
}

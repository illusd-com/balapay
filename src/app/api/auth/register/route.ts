import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken, attachSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const recaptchaToken = String(body.recaptchaToken || "");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "請輸入有效電子郵件" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "密碼至少需要 8 個字元" }, { status: 400 });
    }
    if (!name || name.length < 1) {
      return NextResponse.json({ error: "請輸入顯示名稱" }, { status: 400 });
    }

    if (recaptchaToken) {
      const captchaOk = await verifyRecaptcha(recaptchaToken);
      if (!captchaOk) {
        return NextResponse.json({ error: "請完成機器人驗證（reCAPTCHA）" }, { status: 400 });
      }
    }

    const user = await registerUser(email, password, name, false);
    const token = await createToken(user.id, {
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_verified: false,
      },
      message: "註冊成功。請至「我的」完成實名驗證後再進行收付款。",
    });
    return attachSessionCookie(res, token);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "註冊失敗" }, { status: 400 });
  }
}

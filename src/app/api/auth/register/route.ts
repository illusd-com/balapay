import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken, attachSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";
import { checkBlagovId, namesMatch } from "@/lib/blagov";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password, name, idNumber, recaptchaToken } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "請輸入電子郵件與密碼" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "請輸入真實姓名（至少 2 個字）" }, { status: 400 });
    }
    if (!idNumber || typeof idNumber !== "string" || idNumber.trim().length < 8) {
      return NextResponse.json({ error: "請輸入有效的巴拉國身分證字號" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "密碼至少需要 8 個字元" }, { status: 400 });
    }

    const captchaOk = await verifyRecaptcha(String(recaptchaToken || ""));
    if (!captchaOk) {
      return NextResponse.json({ error: "請完成機器人驗證（reCAPTCHA）" }, { status: 400 });
    }

    const blagov = await checkBlagovId(idNumber, password);
    if (!blagov.ok) {
      return NextResponse.json({ error: blagov.reason }, { status: 400 });
    }

    if (!namesMatch(name, blagov.name)) {
      return NextResponse.json(
        {
          error: `姓名與 e政府登記不符（登記姓名：${blagov.name}），請輸入正確真實姓名`,
        },
        { status: 400 }
      );
    }

    const user = await registerUser(email, password, blagov.name.trim(), true);
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
        is_verified: true,
      },
      verifiedName: blagov.name,
    });
    return attachSessionCookie(res, token);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "註冊失敗" }, { status: 400 });
  }
}

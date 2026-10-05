import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken, setSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password, name, idNumber } = await req.json();

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

    // One-time ID verification only — we do NOT store the ID number
    const idClean = idNumber.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,20}$/.test(idClean)) {
      return NextResponse.json(
        { error: "身分證字號格式無效，請確認後再試" },
        { status: 400 }
      );
    }

    const user = await registerUser(email, password, name.trim(), true);
    const token = await createToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, is_verified: true },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "註冊失敗" }, { status: 400 });
  }
}

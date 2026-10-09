import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken, attachSessionCookie } from "@/lib/auth";
import { ensureSchema, getTurso, tursoEnvStatus } from "@/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const env = tursoEnvStatus();
    if (!env.hasUrl || !env.hasToken) {
      return NextResponse.json(
        {
          error:
            "資料庫未設定：請在 Vercel → Settings → Environment Variables 加入 TURSO_DATABASE_URL 與 TURSO_AUTH_TOKEN（Production），並 Redeploy",
          code: "NO_TURSO_ENV",
          hasUrl: env.hasUrl,
          hasToken: env.hasToken,
        },
        { status: 503 }
      );
    }

    try {
      await ensureSchema();
    } catch (e: any) {
      return NextResponse.json(
        {
          error: "資料庫連線失敗：" + String(e?.message || e).slice(0, 120),
          code: "TURSO_SCHEMA_FAIL",
          ...tursoEnvStatus(),
        },
        { status: 503 }
      );
    }

    if (!getTurso()) {
      return NextResponse.json(
        {
          error: "無法建立資料庫連線，請檢查 Turso URL / Token 是否正確",
          code: "TURSO_CLIENT_NULL",
          ...tursoEnvStatus(),
        },
        { status: 503 }
      );
    }

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
      is_verified: Boolean((user as any).is_verified),
    });
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_verified: Boolean((user as any).is_verified),
      },
    });
    return attachSessionCookie(res, token);
  } catch (e: any) {
    console.error("[login]", e?.message || e);
    const msg = e?.message || "登入失敗";
    const isDb =
      msg.includes("資料庫") || msg.includes("Turso") || msg.includes("連線");
    return NextResponse.json(
      {
        error: msg,
        code: isDb ? "DB_ERROR" : "AUTH_ERROR",
        ...(isDb ? tursoEnvStatus() : {}),
      },
      { status: isDb ? 503 : 401 }
    );
  }
}

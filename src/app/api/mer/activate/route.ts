import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";
import { activateMerchant } from "@/lib/merchant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          error: "登入狀態無效或帳戶不在資料庫中。請登出後重新登入／註冊。",
          code: "NO_SESSION",
        },
        { status: 401 }
      );
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json(
        {
          error:
            "資料庫未連線。請在 Vercel 設定 TURSO_DATABASE_URL 與 TURSO_AUTH_TOKEN 後重新部署。",
          code: "NO_TURSO",
        },
        { status: 503 }
      );
    }

    const exists = await turso.execute({
      sql: "SELECT id, email FROM users WHERE id = ? OR email = ?",
      args: [session.id, session.email.toLowerCase()],
    });
    if (exists.rows.length === 0) {
      return NextResponse.json(
        {
          error: "帳戶未寫入資料庫（可能是舊版假登入）。請登出後重新註冊一次。",
          code: "USER_NOT_IN_DB",
        },
        { status: 400 }
      );
    }
    const realId = exists.rows[0].id as string;

    const body = await req.json().catch(() => ({}));
    const shopName = String(body.shopName || session.name || "我的商店").slice(0, 80);

    const mer = await activateMerchant(realId, shopName, session.email);

    return NextResponse.json({
      success: true,
      mer_id: mer.mer_id,
      api_key: mer.api_key,
      shop_name: mer.shop_name,
      message: "商家已啟用。請妥善保存 api_key（完整金鑰僅此時顯示）。",
    });
  } catch (e: any) {
    console.error("[mer/activate]", e);
    return NextResponse.json(
      { error: e?.message || "啟用失敗", code: "ACTIVATE_FAIL" },
      { status: 400 }
    );
  }
}

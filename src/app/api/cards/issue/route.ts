import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";
import { encryptNfcPayload, generateCardId, buildPlainText } from "@/lib/nfc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    if (!session.is_verified) {
      return NextResponse.json({ error: "請先完成實名驗證再發行 NFC 卡" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const label = String(body.label || "我的電子卡").slice(0, 40);
    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線" }, { status: 503 });
    }

    const cardId = generateCardId();
    const belong = session.email.toLowerCase();

    await turso.execute({
      sql: `INSERT INTO nfc_cards (card_id, belong_email, user_id, status, label)
            VALUES (?, ?, ?, 'active', ?)`,
      args: [cardId, belong, session.id, label],
    });

    const encrypted = encryptNfcPayload(belong, cardId);
    const plainForDisplay = buildPlainText(belong, cardId);

    return NextResponse.json({
      success: true,
      card_id: cardId,
      belong_email: belong,
      label,
      nfc_payload: encrypted,
      plain_preview: plainForDisplay,
      message: "卡片已在雲端發行。請用支援 Web NFC 的裝置將加密內容寫入實體卡。",
    });
  } catch (e: any) {
    console.error("[cards/issue]", e);
    return NextResponse.json({ error: e.message || "發行失敗" }, { status: 400 });
  }
}

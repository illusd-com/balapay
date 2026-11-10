import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getTurso } from "@/lib/turso";
import { decryptOrParseNfcPayload } from "@/lib/nfc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let cardId = String(body.cardId || "").trim().toUpperCase();
    let belongFromCard = "";

    if (body.payload) {
      const parsed = decryptOrParseNfcPayload(String(body.payload));
      if (!parsed) {
        return NextResponse.json(
          { error: "無法解析 NFC 內容（密文無效或格式錯誤）" },
          { status: 400 }
        );
      }
      cardId = parsed.cardId.toUpperCase();
      belongFromCard = parsed.belong.toLowerCase();
    }

    if (!cardId) {
      return NextResponse.json({ error: "請提供 NFC payload 或 Card-ID" }, { status: 400 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線" }, { status: 503 });
    }

    const cardRes = await turso.execute({
      sql: `SELECT card_id, belong_email, user_id, status, label, issued_at
            FROM nfc_cards WHERE upper(card_id) = ?`,
      args: [cardId],
    });

    if (!cardRes.rows.length) {
      return NextResponse.json({ error: "雲端查無此卡號", found: false }, { status: 404 });
    }

    const card = cardRes.rows[0];
    const belong = String(card.belong_email).toLowerCase();
    if (belongFromCard && belongFromCard !== belong) {
      return NextResponse.json(
        { error: "卡面記名與雲端不符，可能遭竄改", found: true },
        { status: 400 }
      );
    }

    const ownerMatch = belong === session.email.toLowerCase();
    const status = String(card.status || "active");

    let transactions: any[] = [];
    let balance: number | null = null;
    let walletName: string | null = null;

    if (ownerMatch && status === "active") {
      const u = await turso.execute({
        sql: "SELECT name, balance FROM users WHERE id = ?",
        args: [card.user_id],
      });
      if (u.rows.length) {
        balance = Number(u.rows[0].balance) || 0;
        walletName = (u.rows[0].name as string) || null;
      }
      const tx = await turso.execute({
        sql: `SELECT id, type, amount, counterpart, note, status, created_at
              FROM transactions WHERE user_id = ?
              ORDER BY created_at DESC LIMIT 30`,
        args: [card.user_id],
      });
      transactions = tx.rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        counterpart: r.counterpart,
        note: r.note,
        status: r.status,
        created_at: r.created_at,
      }));
    }

    return NextResponse.json({
      found: true,
      card_id: card.card_id,
      status,
      label: card.label,
      issued_at: card.issued_at,
      owner_match: ownerMatch,
      belong_email: ownerMatch ? belong : null,
      balance: ownerMatch ? balance : null,
      wallet_name: ownerMatch ? walletName : null,
      transactions: ownerMatch ? transactions : [],
      message: ownerMatch
        ? status !== "active"
          ? "此卡已掛失或停用"
          : "查詢成功"
        : "此卡非本帳號所有，無法顯示金額與明細",
    });
  } catch (e: any) {
    console.error("[cards/lookup]", e);
    return NextResponse.json({ error: e.message || "查詢失敗" }, { status: 400 });
  }
}

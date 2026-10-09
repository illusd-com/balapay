import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getTurso } from "@/lib/turso";
import { authMerchantApi } from "@/lib/merchant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handle(req, Object.fromEntries(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handle(req, body);
}

async function handle(req: NextRequest, data: any) {
  try {
    await ensureSchema();
    const merId = req.headers.get("x-mer-id") || "";
    const apiKey = req.headers.get("x-api-key") || "";
    const mer = await authMerchantApi(merId, apiKey);
    if (!mer) {
      return NextResponse.json({ error: "無效的 mer-id 或 api_key" }, { status: 401 });
    }

    const email = String(data.email || data.payerEmail || data.paywho || "")
      .toLowerCase()
      .trim();
    const amountRaw = data.amount ?? data.payhow;
    const amount =
      amountRaw === undefined || amountRaw === ""
        ? null
        : typeof amountRaw === "number"
          ? amountRaw
          : parseFloat(String(amountRaw));

    if (!email.includes("@")) {
      return NextResponse.json({ error: "請提供 email / payerEmail" }, { status: 400 });
    }

    const turso = getTurso();
    if (!turso) {
      return NextResponse.json({ error: "資料庫未連線" }, { status: 503 });
    }

    const r = await turso.execute({
      sql: "SELECT email, name, balance, is_verified FROM users WHERE email = ? OR lower(email) = ?",
      args: [email, email],
    });

    if (!r.rows.length) {
      return NextResponse.json({
        exists: false,
        verified: false,
        "Enough money": false,
        Enough_money: false,
        "Remaining amount": 0,
        Remaining_amount: 0,
        message: "付款人未註冊 BalaPAY",
      });
    }

    const row = r.rows[0];
    const bal = Number(row.balance) || 0;
    const verified = Number(row.is_verified) === 1;
    const enough = amount == null ? null : bal >= amount && verified;

    return NextResponse.json({
      exists: true,
      verified,
      name: row.name,
      email: row.email,
      balance: bal,
      "Remaining amount": bal,
      Remaining_amount: bal,
      required: amount,
      "Enough money": enough,
      Enough_money: enough,
      message:
        enough === false
          ? `Enough money=false  Remaining amount=${bal}`
          : enough === true
            ? "Enough money=true"
            : verified
              ? "付款人存在且已實名"
              : "付款人存在但尚未實名",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "查詢失敗" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTurso, ensureSchema } from "@/lib/turso";
import { demoGetTxs } from "@/lib/store";

export async function GET() {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const turso = getTurso();
    if (!turso) {
      const txs = demoGetTxs(session.id);
      return NextResponse.json({ transactions: txs });
    }

    const result = await turso.execute({
      sql: `SELECT id, type, amount, counterpart, note, status, created_at
            FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [session.id],
    });

    const transactions = result.rows.map((row) => ({
      id: row.id as string,
      type: row.type as string,
      amount: Number(row.amount),
      counterpart: (row.counterpart as string) || "",
      note: (row.note as string) || "",
      status: (row.status as string) || "completed",
      created_at: row.created_at as string,
    }));

    return NextResponse.json({ transactions });
  } catch (e: any) {
    console.error("[transactions]", e);
    return NextResponse.json({ error: e.message || "讀取失敗" }, { status: 500 });
  }
}

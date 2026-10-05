import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema } from "@/lib/turso";

export async function GET() {
  try {
    await ensureSchema();
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      balance: user.balance,
      is_verified: user.is_verified,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "讀取失敗" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { chatWithAI, buildSystemPrompt } from "@/lib/nvidia";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { message, history = [] } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "請輸入訊息" }, { status: 400 });
    }

    const system = buildSystemPrompt({
      name: session.name,
      email: session.email,
      balance: session.balance,
      is_verified: session.is_verified,
    });

    const messages = [
      { role: "system" as const, content: system },
      ...history.slice(-8).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: String(m.content || ""),
      })),
      { role: "user" as const, content: message },
    ];

    const result = await chatWithAI(messages);
    return NextResponse.json({
      content: result.content,
      balance: session.balance,
    });
  } catch (e: any) {
    console.error("AI chat error:", e);
    return NextResponse.json(
      { error: e.message || "AI 服務暫時無法使用" },
      { status: 500 }
    );
  }
}

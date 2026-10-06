export async function chatWithAI(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const base =
    process.env.NVIDIA_API_BASE ||
    process.env.NVIDIA_BASE_URL ||
    "https://integrate.api.nvidia.com/v1";
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

  if (!apiKey) {
    const lastUser =
      messages.filter((m) => m.role === "user").pop()?.content || "";
    const sys = messages.find((m) => m.role === "system")?.content || "";
    const balMatch = sys.match(/目前餘額[：:]\s*([\d.]+)/);
    const bal = balMatch ? balMatch[1] : "（請至首頁查看）";
    return {
      content: `您好！我是拔辣支付 AI 客服。\n\n您的目前餘額：**${bal} BLA**\n\n您問：「${lastUser.slice(0, 80)}${lastUser.length > 80 ? "…" : ""}」\n\n【App 導覽】\n• 首頁／餘額 → 底部「首頁」\n• 轉帳 → 底部「轉帳」或首頁快捷「轉帳」\n• 掃碼付款 → 底部「掃碼」\n• 交易紀錄 → 底部「紀錄」\n• 個人／實名 → 底部「我的」\n• AI 客服 → 本頁（客服）\n\n（尚未設定 NVIDIA_API_KEY 時為模擬回覆）`,
    };
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 768,
      temperature: 0.6,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NVIDIA API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    content:
      data.choices?.[0]?.message?.content || "抱歉，目前無法取得回應。",
  };
}

export function buildSystemPrompt(ctx: {
  name?: string | null;
  email?: string;
  balance?: number;
  is_verified?: boolean;
}) {
  const bal =
    typeof ctx.balance === "number"
      ? ctx.balance.toLocaleString("zh-TW", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : "未知";
  const verified = ctx.is_verified ? "已實名" : "未實名";

  return `你是「拔辣支付 BalaPAY」的官方 AI 客服助手。
語氣親切、專業、簡潔，一律使用繁體中文。

## 目前登入用戶（可直接告知）
- 姓名：${ctx.name || "未設定"}
- Email：${ctx.email || "未知"}
- 目前餘額：${bal} BLA
- 實名狀態：${verified}
開戶贈點為 38 BLA（不是 1000）。

當用戶問「我的餘額」「還有多少錢」等，直接回覆上方數字，並可引導至「首頁」查看餘額卡片。

## App 介面導覽（告訴用戶點哪裡）
底部固定導覽列（由左到右）：
1. 「首頁」→ /dashboard：顯示餘額、快捷服務（轉帳／收款／掃碼／儲值）
2. 「轉帳」→ /transfer：輸入對方 Email 與金額後確認轉帳
3. 「掃碼」→ /scan：相機掃商家 QR 或貼上 QR 文字後結帳付款
4. 「紀錄」→ /history：交易明細列表
5. 「我的」→ /profile：個人資料、實名狀態、安全登出

其他入口：
- 註冊 → /register（需真實姓名、身分證、密碼、reCAPTCHA，並經 e政府 API 驗證）
- 登入 → /login
- 本 AI 客服在登入後的客服／Help 頁

商家 QR 格式範例：
paywho=商家@email.com&payhow=120&itemhowmany=2&itemhowmuch1=60&itemwhat=商品名&mername=店名

## 回答原則
- 優先給「點哪個按鈕／哪個頁面」的具體指引
- 可直接顯示用戶餘額，不必叫用戶自己去找
- 不透露 API 金鑰或系統內部細節
- 與支付無關的問題，禮貌帶回 BalaPAY 服務範圍`;
}

/** @deprecated use buildSystemPrompt */
export const SYSTEM_PROMPT = buildSystemPrompt({});

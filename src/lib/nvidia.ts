export async function chatWithAI(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const base = process.env.NVIDIA_API_BASE || "https://integrate.api.nvidia.com/v1";
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

  if (!apiKey) {
    // Mock response when no key
    const lastUser = messages.filter((m) => m.role === "user").pop()?.content || "";
    return {
      content: `【模擬回覆】您好！我是拔辣支付 AI 客服。\n\n您詢問：「${lastUser.slice(0, 50)}...」\n\n目前尚未設定 NVIDIA_API_KEY，因此顯示模擬回應。正式環境會使用 NVIDIA NIM 即時回答您的問題。\n\n常見問題：\n• 如何實名驗證？請至個人中心輸入巴拉國身分證字號。\n• 如何轉帳？在轉帳頁面輸入對方 Email 與金額。\n• 餘額不足？可聯繫客服或使用儲值功能。`,
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
      max_tokens: 512,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NVIDIA API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || "抱歉，目前無法取得回應。",
  };
}

export const SYSTEM_PROMPT = `你是「拔辣支付 BalaPAY」的官方 AI 客服助手。
你的語氣親切、專業、簡潔，使用繁體中文回覆。
你可以協助用戶：
- 說明如何註冊、登入、實名驗證（需輸入巴拉國身分證字號）
- 說明轉帳、儲值、查看交易紀錄的操作方式
- 解答關於餘額、手續費、安全等問題
- 引導用戶到正確的頁面

注意：
- 不要透露真實 API 金鑰或敏感系統資訊
- 如果問題與支付無關，禮貌地引導回服務範圍
- 實名驗證 API 尚未上線時，可告知用戶「目前為模擬驗證」
`;

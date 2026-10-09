import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BalaPAY 商家 API 使用說明 | merapi-does",
  description: "如何使用 mer-id 與 api_key 呼叫 BalaPAY 商家收款、退款、產碼 API",
};

const base = "https://你的網域";

export default function MerApiDoesPage() {
  return (
    <div className="min-h-screen bg-[#f7faf5] text-slate-800">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-green-700 tracking-tight">
            拔辣支付 · API
          </Link>
          <div className="flex gap-3 text-sm">
            <Link href="/mer" className="text-slate-500 hover:text-green-700">
              商家中心
            </Link>
            <Link href="/dashboard" className="text-slate-500 hover:text-green-700">
              回到 App
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">
        <div>
          <p className="text-xs font-medium text-green-600 tracking-wide uppercase">Documentation</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">商家 API 使用說明</h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            先到{" "}
            <Link href="/mer" className="text-green-700 underline underline-offset-2">/mer</Link>{" "}
            啟用商家，取得 mer-id 與 api_key，再依本頁呼叫 API。
          </p>
        </div>

        <Section title="1. 取得憑證">
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
            <li>登入已實名 BalaPAY 帳號</li>
            <li>開啟 /mer → 填店名 → 啟用商家</li>
            <li>複製 mer-id 與完整 api_key（僅啟用時顯示一次）</li>
          </ol>
          <Callout>api_key 請只放伺服器環境變數，勿寫入前端公開程式。</Callout>
        </Section>

        <Section title="2. 驗證方式">
          <p className="text-sm text-slate-600 mb-3">每個需授權請求帶 Header：</p>
          <Pre>{`X-Mer-Id: MER_XXXXXXXXXXXX\nX-Api-Key: bp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Pre>
        </Section>

        <Section title="3. 端點總覽">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">方法</th>
                  <th className="px-4 py-2.5 font-medium">路徑</th>
                  <th className="px-4 py-2.5 font-medium">說明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <Tr m="POST" p="/api/mer/activate" d="Session 啟用商家" />
                <Tr m="GET" p="/api/mer/me" d="查商家與餘額" />
                <Tr m="POST" p="/api/mer/qr" d="產生收款 QR" />
                <Tr m="POST" p="/api/mer/charge" d="向用戶收款" />
                <Tr m="POST" p="/api/mer/refund" d="退款給用戶" />
                <Tr m="GET" p="/api/mer/transactions" d="交易列表" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. 產生收款碼 POST /api/mer/qr">
          <Pre>{`curl -X POST ${base}/api/mer/qr \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"item":"招牌拉麵","amount":120,"qty":1}'`}</Pre>
          <p className="text-sm text-slate-600 mt-3">
            回傳 payload 與 qr_image_url。客人用 App「掃碼」付款後入商家餘額。
          </p>
        </Section>

        <Section title="5. 直接收款 POST /api/mer/charge">
          <Pre>{`curl -X POST ${base}/api/mer/charge \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"payerEmail":"customer@example.com","amount":50,"item":"外送費"}'`}</Pre>
        </Section>

        <Section title="6. 退款 POST /api/mer/refund">
          <Pre>{`curl -X POST ${base}/api/mer/refund \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"payerEmail":"customer@example.com","amount":50,"note":"取消退款"}'`}</Pre>
          <Callout>退款從商家餘額扣除；餘額不足會失敗。</Callout>
        </Section>

        <Section title="7. 查交易 GET /api/mer/transactions">
          <Pre>{`curl "${base}/api/mer/transactions?limit=20" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx"`}</Pre>
        </Section>

        <Section title="8. Node.js 範例">
          <Pre>{`const MER_ID = process.env.BALAPAY_MER_ID;
const API_KEY = process.env.BALAPAY_API_KEY;
const BASE = "https://你的網域";

async function charge(payerEmail, amount, item) {
  const res = await fetch(BASE + "/api/mer/charge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mer-Id": MER_ID,
      "X-Api-Key": API_KEY,
    },
    body: JSON.stringify({ payerEmail, amount, item }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}`}</Pre>
        </Section>

        <Section title="9. 錯誤碼">
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li><code className="bg-slate-100 px-1 rounded">401</code> — mer-id / api_key 錯誤</li>
            <li><code className="bg-slate-100 px-1 rounded">400</code> — 參數錯誤、餘額不足</li>
            <li><code className="bg-slate-100 px-1 rounded">404</code> — 付款人不存在</li>
            <li><code className="bg-slate-100 px-1 rounded">503</code> — 資料庫未連線</li>
          </ul>
        </Section>

        <p className="text-center text-xs text-slate-400 pt-6 pb-10">
          BalaPAY Merchant API · blagov.illusd.com
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="text-[12px] leading-relaxed bg-slate-900 text-slate-100 rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
      {children}
    </div>
  );
}

function Tr({ m, p, d }: { m: string; p: string; d: string }) {
  return (
    <tr>
      <td className="px-4 py-2.5 font-mono text-xs text-green-700">{m}</td>
      <td className="px-4 py-2.5 font-mono text-xs">{p}</td>
      <td className="px-4 py-2.5 text-slate-600">{d}</td>
    </tr>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "商家 API 說明｜BalaPAY",
  description: "如何使用 mer-id 與 api_key 呼叫 BalaPAY 即時收款、退款、產碼 API",
};

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-slate-900 text-slate-100 text-[12px] leading-relaxed p-4 font-mono">
      {children}
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3 leading-relaxed">
      {children}
    </div>
  );
}

function Tr({ m, p, d }: { m: string; p: string; d: string }) {
  return (
    <tr>
      <td className="px-4 py-2.5 font-mono text-xs text-green-700">{m}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{p}</td>
      <td className="px-4 py-2.5 text-slate-600">{d}</td>
    </tr>
  );
}

export default function MerApiDoesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/80 via-white to-white text-slate-800">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-slate-900">
            拔辣支付 <span className="text-green-600 font-medium text-sm">API</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/mer" className="text-green-700 hover:underline">商家中心</Link>
            <Link href="/dashboard" className="text-slate-500 hover:underline">返回 App</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">
        <div>
          <p className="text-xs font-medium text-green-600 tracking-wide uppercase">Documentation</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">商家 API 使用說明</h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            在外部系統呼叫 BalaPAY，用付款人 Email <strong>即時扣款收款</strong>。先到{" "}
            <Link href="/mer" className="text-green-700 underline underline-offset-2">/mer</Link>{" "}
            取得 mer-id 與 api_key。
          </p>
        </div>

        <Section title="1. 驗證 Header">
          <Pre>{`X-Mer-Id: MER_XXXXXXXXXXXX\nX-Api-Key: bp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Pre>
        </Section>

        <Section title="2. 即時收款 POST /api/mer/charge">
          <p className="text-sm text-slate-600">
            商家填入付款人 Email 與金額等資料，系統立刻從付款人餘額扣款並入帳商家。雙方皆需已實名。
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 mt-3">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">欄位</th>
                  <th className="px-4 py-2 font-medium">必填</th>
                  <th className="px-4 py-2 font-medium">說明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr><td className="px-4 py-2 font-mono text-xs">payerEmail</td><td className="px-4 py-2">是</td><td className="px-4 py-2">付款人 BalaPAY Email（或 paywho）</td></tr>
                <tr><td className="px-4 py-2 font-mono text-xs">amount</td><td className="px-4 py-2">是</td><td className="px-4 py-2">總金額（或 payhow）</td></tr>
                <tr><td className="px-4 py-2 font-mono text-xs">item</td><td className="px-4 py-2">否</td><td className="px-4 py-2">商品名（或 itemwhat）</td></tr>
                <tr><td className="px-4 py-2 font-mono text-xs">qty</td><td className="px-4 py-2">否</td><td className="px-4 py-2">數量，預設 1（或 itemhowmany）</td></tr>
                <tr><td className="px-4 py-2 font-mono text-xs">unitPrice</td><td className="px-4 py-2">否</td><td className="px-4 py-2">單價（或 itemhowmuch1）</td></tr>
                <tr><td className="px-4 py-2 font-mono text-xs">mername</td><td className="px-4 py-2">否</td><td className="px-4 py-2">店名</td></tr>
                <tr><td className="px-4 py-2 font-mono text-xs">note</td><td className="px-4 py-2">否</td><td className="px-4 py-2">備註</td></tr>
              </tbody>
            </table>
          </div>

          <Pre>{`curl -X POST https://balapay.illusd.com/api/mer/charge \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXXXXXXXXXX" \\\n  -H "X-Api-Key: bp_live_xxxxxxxx" \\\n  -d '{\n    "payerEmail": "customer@email.com",\n    "amount": 120,\n    "item": "招牌拉麵",\n    "qty": 2,\n    "unitPrice": 60,\n    "mername": "拔辣食堂",\n    "note": "桌號 A3"\n  }'`}</Pre>

          <h3 className="text-sm font-semibold text-slate-800">餘額不足回應</h3>
          <Pre>{`{\n  "success": false,\n  "Enough money": false,\n  "Remaining amount": 38,\n  "message": "Enough money=false  Remaining amount=38",\n  "error": "Enough money=false  Remaining amount=38",\n  "required": 120,\n  "payerEmail": "customer@email.com"\n}`}</Pre>
          <Callout>
            字串：Enough money=false Remaining amount=剩餘金額。請讀 JSON 的 Remaining amount。
          </Callout>
        </Section>

        <Section title="3. 退款 / 查帳">
          <Pre>{`# 退款\ncurl -X POST https://balapay.illusd.com/api/mer/refund \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"payerEmail":"customer@email.com","amount":60}'\n\n# 今日交易\ncurl https://balapay.illusd.com/api/mer/list/today \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"\n\n# 單筆\ncurl https://balapay.illusd.com/api/mer/check/id=交易ID \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"`}</Pre>
        </Section>

        <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">BalaPAY · 商家 API</p>
      </main>
    </div>
  );
}

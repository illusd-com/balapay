import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BalaPAY 商家 API 使用說明 | merapi-does",
  description: "如何使用 mer-id 與 api_key 呼叫 BalaPAY 商家收款、退款、產碼、列表與查單 API",
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
            <Link href="/mer" className="text-slate-500 hover:text-green-700">商家中心</Link>
            <Link href="/dashboard" className="text-slate-500 hover:text-green-700">回到 App</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">
        <div>
          <p className="text-xs font-medium text-green-600 tracking-wide uppercase">Documentation</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">商家 API 使用說明</h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            先到 <Link href="/mer" className="text-green-700 underline underline-offset-2">/mer</Link>{" "}
            啟用商家，取得 mer-id 與 api_key。
          </p>
        </div>

        <Section title="1. 驗證 Header">
          <Pre>{`X-Mer-Id: MER_XXXXXXXXXXXX\nX-Api-Key: bp_live_xxxxxxxx`}</Pre>
        </Section>

        <Section title="2. 端點總覽">
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
                <Tr m="POST" p="/api/mer/charge" d="收款" />
                <Tr m="POST" p="/api/mer/refund" d="退款" />
                <Tr m="POST" p="/api/mer/qr" d="產收款 QR" />
                <Tr m="GET" p="/api/mer/list/today" d="今日交易 + 收支小計" />
                <Tr m="GET" p="/api/mer/list/all" d="全部交易（分頁）" />
                <Tr m="GET" p="/api/mer/check/{id}" d="查單一交易" />
                <Tr m="GET" p="/api/mer/check?id=" d="查單一交易（query）" />
                <Tr m="GET" p="/api/mer/me" d="商家資料與餘額" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. 今日列表 GET /api/mer/list/today">
          <Pre>{`curl "${base}/api/mer/list/today" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx"`}</Pre>
          <p className="text-sm text-slate-600 mt-2">回傳 date、count、total_in、total_out、transactions[]（台北時區今日）。</p>
        </Section>

        <Section title="4. 全部列表 GET /api/mer/list/all">
          <Pre>{`curl "${base}/api/mer/list/all?limit=50&offset=0" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx"`}</Pre>
          <p className="text-sm text-slate-600 mt-2">回傳 total、count、limit、offset、transactions[]。</p>
        </Section>

        <Section title="5. 查單筆 GET /api/mer/check/{id}">
          <Pre>{`curl "${base}/api/mer/check/交易ID" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx"\n\n# 或\ncurl "${base}/api/mer/check?id=交易ID" \\\n  -H "X-Mer-Id: MER_XXXX" \\\n  -H "X-Api-Key: bp_live_xxxx"`}</Pre>
          <p className="text-sm text-slate-600 mt-2">僅能查本商家帳戶的交易；回傳 found 與 transaction（含 direction: in/out）。</p>
        </Section>

        <Section title="6. 收款 / 退款（摘要）">
          <Pre>{`# 收款\ncurl -X POST ${base}/api/mer/charge \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"payerEmail":"a@b.com","amount":50,"item":"商品"}'\n\n# 退款\ncurl -X POST ${base}/api/mer/refund \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"payerEmail":"a@b.com","amount":50}'`}</Pre>
        </Section>

        <Section title="7. 錯誤碼">
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li><code className="bg-slate-100 px-1 rounded">401</code> — 憑證錯誤</li>
            <li><code className="bg-slate-100 px-1 rounded">404</code> — 交易或不存在</li>
            <li><code className="bg-slate-100 px-1 rounded">400</code> — 參數錯誤</li>
            <li><code className="bg-slate-100 px-1 rounded">503</code> — 資料庫未連線</li>
          </ul>
        </Section>

        <p className="text-center text-xs text-slate-400 pt-6 pb-10">BalaPAY Merchant API · blagov.illusd.com</p>
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

function Tr({ m, p, d }: { m: string; p: string; d: string }) {
  return (
    <tr>
      <td className="px-4 py-2.5 font-mono text-xs text-green-700">{m}</td>
      <td className="px-4 py-2.5 font-mono text-xs">{p}</td>
      <td className="px-4 py-2.5 text-slate-600">{d}</td>
    </tr>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BalaPAY 商家 API 完整文件",
  description: "拔辣支付商家 API：即時收款、退款、QR、對帳、付款人餘額預查。",
};

const BASE = "https://balapay.illusd.com";

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-emerald-50/95 text-[11.5px] sm:text-[12.5px] leading-relaxed p-4 sm:p-5 font-mono border border-slate-800">
      {children}
    </pre>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-bold text-slate-900 tracking-tight pt-2 scroll-mt-20 border-b border-slate-100 pb-2">
      {children}
    </h2>
  );
}

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${map[tone] || map.green}`}>
      {children}
    </span>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-950 text-sm px-4 py-3 leading-relaxed">
      {children}
    </div>
  );
}

function Endpoint({
  method, path, title, children,
}: { method: string; path: string; title: string; children: React.ReactNode }) {
  const tone = method.startsWith("GET") ? "blue" : "green";
  return (
    <article className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 bg-slate-50/80 border-b border-slate-100">
        <Badge tone={tone}>{method}</Badge>
        <code className="text-sm font-semibold text-slate-800 break-all">{path}</code>
        <span className="text-slate-400 text-sm">·</span>
        <span className="text-sm text-slate-600">{title}</span>
      </div>
      <div className="px-5 py-4 space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>
    </article>
  );
}

function FieldTable({ rows }: { rows: { name: string; req?: boolean; type?: string; desc: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs">
          <tr>
            <th className="px-3 py-2 font-medium">欄位</th>
            <th className="px-3 py-2 font-medium">必填</th>
            <th className="px-3 py-2 font-medium">型別</th>
            <th className="px-3 py-2 font-medium">說明</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="px-3 py-2 font-mono text-xs text-emerald-800">{r.name}</td>
              <td className="px-3 py-2">{r.req ? "是" : "否"}</td>
              <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.type || "string"}</td>
              <td className="px-3 py-2 text-slate-600">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const toc = [
  { id: "intro", label: "總覽" },
  { id: "auth", label: "驗證" },
  { id: "flow", label: "接入流程" },
  { id: "charge", label: "即時收款" },
  { id: "payer-check", label: "付款人預查" },
  { id: "refund", label: "退款" },
  { id: "qr", label: "收款 QR" },
  { id: "me", label: "商家資料" },
  { id: "list", label: "交易列表" },
  { id: "check", label: "查單筆" },
  { id: "errors", label: "錯誤碼" },
  { id: "sdk", label: "多語言範例" },
];

export default function MerApiDoesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-slate-50 text-slate-800">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="font-bold text-slate-900 shrink-0">
            拔辣支付 <span className="text-emerald-600 font-semibold text-sm">Merchant API</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/mer" className="text-emerald-700 hover:underline">商家中心</Link>
            <a href="#charge" className="rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5">開始收款</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12 grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">目錄</p>
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="block text-sm text-slate-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50/80">
                {t.label}
              </a>
            ))}
          </div>
        </aside>

        <main className="space-y-10 min-w-0">
          <section id="intro" className="space-y-4 scroll-mt-20">
            <p className="text-xs font-semibold text-emerald-600 tracking-widest uppercase">Documentation · v1</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              BalaPAY 商家 API
              <span className="block text-lg font-medium text-slate-500 mt-2">用 Email 即時收款 · 退款 · 對帳 · QR</span>
            </h1>
            <p className="text-slate-600 leading-relaxed max-w-2xl">
              在 POS、網站後端、App 伺服器接入拔辣支付。授權使用 X-Mer-Id + X-Api-Key。Base URL：
            </p>
            <Pre>{BASE}</Pre>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { t: "即時扣款", d: "payerEmail + amount 立刻入帳" },
                { t: "餘額預查", d: "收費前確認 Enough money" },
                { t: "完整對帳", d: "今日／全部／單筆查詢" },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
                  <p className="font-semibold text-slate-900 text-sm">{x.t}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{x.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="auth" className="space-y-4 scroll-mt-20">
            <H2 id="auth">驗證方式</H2>
            <p className="text-sm text-slate-600">
              至 <Link href="/mer" className="text-emerald-700 underline">/mer</Link> 啟用商家後取得憑證：
            </p>
            <Pre>{`X-Mer-Id: MER_XXXXXXXXXXXX\nX-Api-Key: bp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Pre>
            <Callout>api_key 等同商家密碼，只放伺服器環境變數，禁止寫進前端或 Git。</Callout>
          </section>

          <section id="flow" className="space-y-4 scroll-mt-20">
            <H2 id="flow">建議接入流程</H2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
              <li>實名 → /mer 啟用 → 保存 mer-id / api_key</li>
              <li>可選：/api/mer/payer-check 確認餘額與實名</li>
              <li>/api/mer/charge 即時扣款，成功後出貨</li>
              <li>refund 退款；list / check 對帳</li>
            </ol>
          </section>

          <section className="space-y-3">
            <H2 id="table">端點一覽</H2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr><th className="px-4 py-2.5">方法</th><th className="px-4 py-2.5">路徑</th><th className="px-4 py-2.5">說明</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    ["POST", "/api/mer/activate", "Session 啟用商家"],
                    ["GET", "/api/mer/me", "商家資料與餘額"],
                    ["POST", "/api/mer/charge", "即時收款"],
                    ["GET/POST", "/api/mer/payer-check", "付款人預查（不扣款）"],
                    ["POST", "/api/mer/refund", "退款"],
                    ["POST", "/api/mer/qr", "產生收款 QR"],
                    ["GET", "/api/mer/list/today", "今日交易"],
                    ["GET", "/api/mer/list/all", "全部交易"],
                    ["GET", "/api/mer/transactions", "交易列表 limit"],
                    ["GET", "/api/mer/check/id={id}", "查單筆交易"],
                  ].map(([m, p, d]) => (
                    <tr key={p}>
                      <td className="px-4 py-2 font-mono text-xs text-emerald-700">{m}</td>
                      <td className="px-4 py-2 font-mono text-xs">{p}</td>
                      <td className="px-4 py-2 text-slate-600">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="charge" className="space-y-4 scroll-mt-20">
            <H2 id="charge">即時收款</H2>
            <Endpoint method="POST" path="/api/mer/charge" title="即時扣款入帳">
              <p>填入付款人 Email 與金額，立刻扣款入帳。雙方需已實名。</p>
              <FieldTable rows={[
                { name: "payerEmail", req: true, desc: "付款人 Email（或 paywho）" },
                { name: "amount", req: true, type: "number", desc: "總金額（或 payhow）" },
                { name: "item", req: false, desc: "商品名（或 itemwhat）" },
                { name: "qty", req: false, type: "number", desc: "數量預設 1（itemhowmany）" },
                { name: "unitPrice", req: false, type: "number", desc: "單價（itemhowmuch1）" },
                { name: "mername", req: false, desc: "店名" },
                { name: "note", req: false, desc: "備註／訂單號" },
              ]} />
              <Pre>{`curl -X POST ${BASE}/api/mer/charge \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXXXXXXXXXX" \\\n  -H "X-Api-Key: bp_live_xxxxxxxx" \\\n  -d '{\n    "payerEmail": "customer@email.com",\n    "amount": 120,\n    "item": "招牌拉麵",\n    "qty": 2,\n    "unitPrice": 60,\n    "mername": "拔辣食堂",\n    "note": "桌號 A3"\n  }'`}</Pre>
              <p className="font-semibold text-slate-800">餘額不足 400</p>
              <Pre>{`{\n  "success": false,\n  "Enough money": false,\n  "Remaining amount": 38,\n  "message": "Enough money=false  Remaining amount=38",\n  "error": "Enough money=false  Remaining amount=38",\n  "required": 120\n}`}</Pre>
              <Callout>不足時不會扣款。請讀 Enough money 與 Remaining amount。</Callout>
            </Endpoint>
          </section>

          <section id="payer-check" className="space-y-4 scroll-mt-20">
            <H2 id="payer-check">付款人預查</H2>
            <Endpoint method="GET/POST" path="/api/mer/payer-check" title="不扣款，只查餘額">
              <FieldTable rows={[
                { name: "email / payerEmail", req: true, desc: "付款人 Email" },
                { name: "amount", req: false, type: "number", desc: "有給則回傳 Enough money" },
              ]} />
              <Pre>{`curl "${BASE}/api/mer/payer-check?email=customer@email.com&amount=120" \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"`}</Pre>
            </Endpoint>
          </section>

          <section id="refund" className="space-y-4 scroll-mt-20">
            <H2 id="refund">退款</H2>
            <Endpoint method="POST" path="/api/mer/refund" title="退回付款人">
              <FieldTable rows={[
                { name: "payerEmail", req: true, desc: "原付款人" },
                { name: "amount", req: true, type: "number", desc: "金額" },
                { name: "note", req: false, desc: "原因" },
              ]} />
              <Pre>{`curl -X POST ${BASE}/api/mer/refund \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"payerEmail":"customer@email.com","amount":60,"note":"取消"}'`}</Pre>
            </Endpoint>
          </section>

          <section id="qr" className="space-y-4 scroll-mt-20">
            <H2 id="qr">收款 QR</H2>
            <Endpoint method="POST" path="/api/mer/qr" title="產生 payload">
              <Pre>{`curl -X POST ${BASE}/api/mer/qr \\\n  -H "Content-Type: application/json" \\\n  -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx" \\\n  -d '{"item":"飲料","qty":1,"unitPrice":35,"amount":35}'`}</Pre>
            </Endpoint>
          </section>

          <section id="me" className="space-y-4 scroll-mt-20">
            <H2 id="me">商家資料</H2>
            <Endpoint method="GET" path="/api/mer/me" title="商店與餘額">
              <Pre>{`curl ${BASE}/api/mer/me -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"`}</Pre>
            </Endpoint>
          </section>

          <section id="list" className="space-y-4 scroll-mt-20">
            <H2 id="list">交易列表</H2>
            <Endpoint method="GET" path="/api/mer/list/today" title="今日">
              <Pre>{`curl ${BASE}/api/mer/list/today -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"`}</Pre>
            </Endpoint>
            <Endpoint method="GET" path="/api/mer/list/all" title="全部">
              <Pre>{`curl ${BASE}/api/mer/list/all -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"`}</Pre>
            </Endpoint>
            <Endpoint method="GET" path="/api/mer/transactions?limit=30" title="可調 limit">
              <Pre>{`curl "${BASE}/api/mer/transactions?limit=50" -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"`}</Pre>
            </Endpoint>
          </section>

          <section id="check" className="space-y-4 scroll-mt-20">
            <H2 id="check">查單筆交易</H2>
            <Endpoint method="GET" path="/api/mer/check/id={charge_id}" title="依 charge_id">
              <Pre>{`curl ${BASE}/api/mer/check/id=你的charge_id -H "X-Mer-Id: MER_XXXX" -H "X-Api-Key: bp_live_xxxx"`}</Pre>
            </Endpoint>
          </section>

          <section id="errors" className="space-y-4 scroll-mt-20">
            <H2 id="errors">常見錯誤</H2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr><th className="px-4 py-2">HTTP</th><th className="px-4 py-2">情況</th><th className="px-4 py-2">處理</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr><td className="px-4 py-2 font-mono text-xs">401</td><td className="px-4 py-2">金鑰錯誤</td><td className="px-4 py-2">檢查 Header</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs">403</td><td className="px-4 py-2">未實名</td><td className="px-4 py-2">完成實名驗證</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs">400</td><td className="px-4 py-2">Enough money=false</td><td className="px-4 py-2">餘額不足</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs">404</td><td className="px-4 py-2">付款人不存在</td><td className="px-4 py-2">請先註冊</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs">503</td><td className="px-4 py-2">DB 未連線</td><td className="px-4 py-2">檢查 Turso</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="sdk" className="space-y-4 scroll-mt-20">
            <H2 id="sdk">多語言範例</H2>
            <p className="text-sm font-semibold text-slate-800">Node.js</p>
            <Pre>{`const MER_ID = process.env.BALAPAY_MER_ID;\nconst API_KEY = process.env.BALAPAY_API_KEY;\nconst BASE = "${BASE}";\n\nasync function charge(payerEmail, amount, extra = {}) {\n  const res = await fetch(\`\${BASE}/api/mer/charge\`, {\n    method: "POST",\n    headers: {\n      "Content-Type": "application/json",\n      "X-Mer-Id": MER_ID,\n      "X-Api-Key": API_KEY,\n    },\n    body: JSON.stringify({ payerEmail, amount, ...extra }),\n  });\n  const data = await res.json();\n  if (!res.ok) throw data;\n  return data;\n}`}</Pre>
            <p className="text-sm font-semibold text-slate-800">Python</p>
            <Pre>{`import os, requests\nBASE = "${BASE}"\nH = {\n  "X-Mer-Id": os.environ["BALAPAY_MER_ID"],\n  "X-Api-Key": os.environ["BALAPAY_API_KEY"],\n  "Content-Type": "application/json",\n}\ndef charge(email, amount, **extra):\n  r = requests.post(f"{BASE}/api/mer/charge", headers=H,\n    json={"payerEmail": email, "amount": amount, **extra}, timeout=30)\n  data = r.json()\n  if not r.ok: raise RuntimeError(data)\n  return data`}</Pre>
          </section>

          <footer className="pt-8 pb-16 border-t border-slate-200 text-xs text-slate-400">
            <p>BalaPAY · 拔辣支付 · /merapi-does · {BASE}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

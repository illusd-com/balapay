"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Store, Key, QrCode, Loader2, Copy, Check, RefreshCw, BookOpen, ArrowDownLeft, Shield,
} from "lucide-react";

const soft = { type: "spring" as const, duration: 0.55, bounce: 0.28 };
const easeOut = [0.23, 1, 0.32, 1] as const;

type MerInfo = {
  mer_id: string;
  shop_name: string;
  email?: string;
  balance?: number;
  api_key_hint?: string;
};

export default function MerPage() {
  const [loading, setLoading] = useState(true);
  const [activated, setActivated] = useState(false);
  const [mer, setMer] = useState<MerInfo | null>(null);
  const [shopName, setShopName] = useState("");
  const [fullKey, setFullKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [item, setItem] = useState("商品");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [qrFields, setQrFields] = useState<Record<string, string | number> | null>(null);
  const [txs, setTxs] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mer/me");
      const data = await res.json();
      if (data.activated && data.merchant) {
        setActivated(true);
        setMer(data.merchant);
        setShopName(data.merchant.shop_name || "");
        const txRes = await fetch("/api/mer/transactions?limit=15");
        const txData = await txRes.json();
        setTxs(txData.transactions || []);
      } else setActivated(false);
    } catch {
      setError("無法載入商家資料");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function activate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/mer/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName: shopName || "我的商店" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "啟用失敗");
      setFullKey(data.api_key);
      setActivated(true);
      setMer({
        mer_id: data.mer_id,
        shop_name: data.shop_name,
        api_key_hint: data.api_key.slice(0, 12) + "…",
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function genQr() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/mer/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          amount: amount ? parseFloat(amount) : undefined,
          qty: parseInt(qty, 10) || 1,
          unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
          shopName: shopName || mer?.shop_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "產碼失敗");
      setQrPayload(data.payload);
      setQrUrl(data.qr_image_url);
      setQrFields(data.fields || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1600);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-5 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={soft}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">商家中心</h1>
            <p className="text-xs text-slate-400 mt-0.5">收款碼 · API · 對帳</p>
          </div>
          <Link href="/merapi-does" className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1.5">
            <BookOpen className="w-3.5 h-3.5" /> API 文件
          </Link>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!activated ? (
          <motion.div key="onboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={soft} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100/80 shadow-sm p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">啟用商家功能</h2>
            <p className="text-sm text-slate-500">啟用後獲得 mer-id 與 api_key。</p>
            <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="店名" className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" />
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <motion.button whileTap={{ scale: 0.97 }} onClick={activate} disabled={busy} className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-semibold text-sm shadow-lg shadow-green-200/50 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              啟用商家
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...soft, delay: 0.05 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 to-emerald-500 p-5 text-white shadow-lg shadow-green-200/40">
              <p className="text-green-100 text-xs font-medium">{mer?.shop_name}</p>
              <p className="text-3xl font-bold mt-1 tabular-nums">{(mer?.balance ?? 0).toLocaleString()} <span className="text-base font-medium opacity-80">BLA</span></p>
              <p className="text-green-100/80 text-xs mt-2">{mer?.email}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...soft, delay: 0.1 }} className="bg-white/80 backdrop-blur rounded-3xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Key className="w-4 h-4 text-green-600" /> API 憑證</div>
              <CredRow label="mer-id" value={mer?.mer_id || ""} copied={copied === "mer"} onCopy={() => copy(mer?.mer_id || "", "mer")} />
              <CredRow label="api_key" value={fullKey || mer?.api_key_hint || "（啟用時曾顯示完整金鑰）"} copied={copied === "key"} onCopy={() => fullKey && copy(fullKey, "key")} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...soft, delay: 0.15 }} className="bg-white/80 backdrop-blur rounded-3xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><QrCode className="w-4 h-4 text-green-600" /> 產生收款碼</div>
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400">mername 店名</label>
                <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="店名" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" />
                <label className="text-[11px] text-slate-400">itemwhat 商品名</label>
                <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="商品名" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">itemhowmany 數量</label>
                    <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min={1} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">itemhowmuch1 單價</label>
                    <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} type="number" placeholder="單價" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" />
                  </div>
                </div>
                <label className="text-[11px] text-slate-400">payhow 總金額（可留空＝單價×數量）</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="總金額" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" />
                <p className="text-[11px] text-slate-400">paywho 自動使用商家登入 Email（{mer?.email || "—"}）</p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={genQr} disabled={busy} className="w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                產生 QR
              </motion.button>
              {qrUrl && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={soft} className="flex flex-col items-center gap-3 pt-2">
                  <img src={qrUrl} alt="QR" className="w-48 h-48 rounded-2xl border border-slate-100" />
                  {qrFields && (
                    <div className="w-full text-left bg-slate-50 rounded-xl p-3 space-y-1 text-[11px] font-mono text-slate-700">
                      {Object.entries(qrFields).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-slate-400 w-28 shrink-0">{k}</span>
                          <span className="break-all">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 break-all px-2 text-center">{qrPayload}</p>
                  <button type="button" onClick={() => copy(qrPayload, "qr")} className="text-xs text-slate-500 flex items-center gap-1">
                    {copied === "qr" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    複製完整 QR 內容
                  </button>
                </motion.div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...soft, delay: 0.2 }} className="bg-white/80 backdrop-blur rounded-3xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ArrowDownLeft className="w-4 h-4 text-green-600" /> 最近交易</div>
                <button type="button" onClick={load} className="text-slate-400"><RefreshCw className="w-3.5 h-3.5" /></button>
              </div>
              {txs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">尚無交易</p>
              ) : (
                <ul className="space-y-2">
                  {txs.map((t, i) => (
                    <motion.li key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.3, ease: easeOut }} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800 truncate">{t.note || t.type}</p>
                        <p className="text-[11px] text-slate-400">{t.counterpart}</p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${Number(t.amount) >= 0 ? "text-emerald-600" : "text-slate-600"}`}>
                        {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount)}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CredRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
      <span className="text-[11px] text-slate-400 w-14 shrink-0">{label}</span>
      <span className="flex-1 text-xs text-slate-800 truncate font-mono">{value}</span>
      <button type="button" onClick={onCopy} className="text-slate-400 hover:text-green-600 shrink-0">
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

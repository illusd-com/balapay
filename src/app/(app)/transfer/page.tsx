"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Banknote, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TransferPage() {
  const router = useRouter();
  const [toEmail, setToEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const num = parseFloat(amount);
    if (!toEmail || isNaN(num) || num <= 0) {
      setError("請輸入有效的 Email 與金額");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1800);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-xl font-bold text-slate-900">轉帳成功</h2>
        <p className="text-slate-500 mt-1 text-sm">已成功轉出 {amount} BLA</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">安全轉帳</h1>
        <p className="text-xs text-slate-400 mt-0.5">銀行級加密 · 即時到帳 · 可追蹤紀錄</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">收款人 Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">金額 (BLA)</label>
            <div className="relative">
              <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm font-semibold text-lg text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">備註（選填）</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：午餐費用"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-green-200"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "處理中..." : "確認轉帳"}
        </button>
      </form>
    </div>
  );
}

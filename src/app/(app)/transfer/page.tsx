"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Banknote, Send, Loader2, CheckCircle2, ArrowDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const spring = { type: "spring" as const, duration: 0.45, bounce: 0.25 };
const easeOut = [0.23, 1, 0.32, 1] as const;

export default function TransferPage() {
  const router = useRouter();
  const [toEmail, setToEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    amount: number;
    toEmail: string;
    received: boolean;
    fromBalance: number;
  } | null>(null);
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
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, amount: num, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "轉帳失敗");
      setSuccess({
        amount: data.amount,
        toEmail: data.toEmail,
        received: data.received,
        fromBalance: data.fromBalance,
      });
    } catch (err: any) {
      setError(err.message || "轉帳失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-6 space-y-6">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={spring}
            className="flex flex-col items-center justify-center min-h-[60vh] px-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.55, bounce: 0.35 }}
              className="relative mb-6"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.9, ease: easeOut, delay: 0.15 }}
                className="absolute inset-0 rounded-full bg-emerald-400/30"
              />
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center relative z-10">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35, ease: easeOut }}
              className="text-xl font-bold text-slate-900"
            >
              轉帳成功
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.35, ease: easeOut }}
              className="text-slate-500 mt-1 text-sm"
            >
              已轉出{" "}
              <span className="font-semibold text-slate-800">{success.amount}</span> BLA
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.4, ease: easeOut }}
              className="mt-6 w-full max-w-sm bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">收款人</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{success.toEmail}</p>
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">對方入帳狀態</span>
                <span className="font-medium text-emerald-600">
                  {success.received ? "已入帳 ✓" : "待開戶入帳"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">您的新餘額</span>
                <span className="font-semibold text-slate-900">{success.fromBalance} BLA</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex gap-3"
            >
              <button
                onClick={() => {
                  setSuccess(null);
                  setToEmail("");
                  setAmount("");
                  setNote("");
                }}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
              >
                再轉一筆
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all duration-150 shadow-md shadow-green-200"
              >
                返回首頁
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-xl font-bold text-slate-900">安全轉帳</h1>
              <p className="text-xs text-slate-400 mt-0.5">銀行級加密 · 即時到帳 · 可追蹤紀錄</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl overflow-hidden"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35, ease: easeOut }}
                className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm"
              >
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200 text-sm text-slate-900 bg-white placeholder:text-slate-400"
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200 text-sm font-semibold text-lg text-slate-900 bg-white placeholder:text-slate-400"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200 text-sm text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-green-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? "處理中..." : "確認轉帳"}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

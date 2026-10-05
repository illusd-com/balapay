"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Loader2, Inbox } from "lucide-react";

type Tx = {
  id: string;
  type: string;
  amount: number;
  counterpart: string;
  note: string;
  status: string;
  created_at: string;
};

const easeOut = [0.23, 1, 0.32, 1] as const;

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return `今天 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((data) => setTxs(data.transactions || []))
      .catch(() => setTxs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-6 space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
      >
        <h1 className="text-xl font-bold text-slate-900">交易紀錄</h1>
        <p className="text-xs text-slate-400 mt-0.5">即時同步 · 可追蹤入帳狀態</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : txs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="flex flex-col items-center py-16 text-slate-400"
        >
          <Inbox className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">尚無交易紀錄</p>
          <p className="text-xs mt-1">完成第一筆轉帳後會顯示在這裡</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {txs.map((tx, i) => {
            const isIn = tx.type === "transfer_in" || tx.amount > 0;
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: easeOut }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04 + 0.05, type: "spring", duration: 0.4, bounce: 0.3 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isIn ? "bg-emerald-50 text-emerald-500" : "bg-green-50 text-green-600"
                  }`}
                >
                  {isIn ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {tx.counterpart || (isIn ? "收款" : "轉出")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTime(tx.created_at)}
                    {tx.note ? ` · ${tx.note}` : ""}
                  </p>
                </div>
                <p
                  className={`font-semibold tabular-nums ${
                    isIn ? "text-emerald-500" : "text-slate-800"
                  }`}
                >
                  {isIn && tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

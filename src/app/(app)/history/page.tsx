"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

const mockTx = [
  { id: "1", type: "out", name: "咖啡店", amount: -85, time: "今天 14:22", note: "美式咖啡" },
  { id: "2", type: "in", name: "小明", amount: 500, time: "昨天 09:15", note: "還款" },
  { id: "3", type: "out", name: "超市", amount: -320, time: "10/02 18:40", note: "日用品" },
  { id: "4", type: "in", name: "系統儲值", amount: 1000, time: "09/28 12:00", note: "開戶贈金" },
];

export default function HistoryPage() {
  return (
    <div className="px-4 pt-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-900">交易紀錄</h1>
      <div className="space-y-2">
        {mockTx.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tx.type === "in" ? "bg-emerald-50 text-emerald-500" : "bg-green-50 text-green-600"
              }`}
            >
              {tx.type === "in" ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{tx.name}</p>
              <p className="text-xs text-slate-400">
                {tx.time} · {tx.note}
              </p>
            </div>
            <p className={`font-semibold ${tx.amount > 0 ? "text-emerald-500" : "text-slate-800"}`}>
              {tx.amount > 0 ? "+" : ""}
              {tx.amount}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

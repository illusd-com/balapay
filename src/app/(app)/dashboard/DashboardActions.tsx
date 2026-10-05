"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, QrCode, Plus } from "lucide-react";

const actions = [
  { href: "/transfer", icon: ArrowUpRight, label: "轉帳", color: "bg-green-50 text-green-600" },
  { href: "/transfer", icon: ArrowDownLeft, label: "收款", color: "bg-emerald-50 text-emerald-600" },
  { href: "/history", icon: QrCode, label: "掃碼", color: "bg-sky-50 text-sky-600" },
  { href: "/profile", icon: Plus, label: "儲值", color: "bg-violet-50 text-violet-600" },
];

const easeOut = [0.23, 1, 0.32, 1] as const;

export function DashboardActions() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 mb-2.5">快捷服務</h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: easeOut }}
          >
            <Link
              href={a.href}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-sm active:scale-95 transition-all duration-150"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.35 }}
                className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}
              >
                <a.icon className="w-5 h-5" />
              </motion.div>
              <span className="text-xs font-medium text-slate-700">{a.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function DashboardClient({ balance }: { balance: number }) {
  const [hidden, setHidden] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-green-700 to-emerald-500 p-6 text-white shadow-xl shadow-green-200/40"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-100">可用餘額</p>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
          {hidden ? "••••••" : formatCurrency(balance)}
        </p>
        <p className="text-xs text-green-200 mt-2">巴拉幣 BLA</p>
      </div>
    </motion.div>
  );
}

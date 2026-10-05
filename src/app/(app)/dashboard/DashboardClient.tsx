"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

function AnimatedBalance({ value, hidden }: { value: number; hidden: boolean }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) =>
    formatCurrency(Math.round(v * 100) / 100)
  );
  const [text, setText] = useState(formatCurrency(0));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on("change", (v) => setText(v));
  }, [display]);

  if (hidden) return <>••••••</>;
  return <>{text}</>;
}

export function DashboardClient({ balance }: { balance: number }) {
  const [hidden, setHidden] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-green-700 to-emerald-500 p-6 text-white shadow-xl shadow-green-200/40"
    >
      <motion.div
        animate={{ x: [0, 8, 0], y: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"
      />
      <motion.div
        animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-100">可用餘額</p>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-90 duration-150"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-3xl md:text-4xl font-bold tracking-tight mt-1 tabular-nums">
          <AnimatedBalance value={balance} hidden={hidden} />
        </p>
        <p className="text-xs text-green-200 mt-2">巴拉幣 BLA</p>
      </div>
    </motion.div>
  );
}

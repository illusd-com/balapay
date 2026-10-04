"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeftRight, Clock, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: Home, label: "首頁" },
  { href: "/transfer", icon: ArrowLeftRight, label: "轉帳" },
  { href: "/history", icon: Clock, label: "紀錄" },
  { href: "/help", icon: MessageCircle, label: "客服" },
  { href: "/profile", icon: User, label: "我的" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors duration-150",
                active ? "text-rose-500" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-rose-50 rounded-xl"
                  transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 relative z-10", active && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium mt-0.5 relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

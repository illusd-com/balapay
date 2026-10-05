import { getSession } from "@/lib/auth";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Plus,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <div className="px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">您好，</p>
          <h1 className="text-xl font-bold text-slate-900">
            {user.name || user.email.split("@")[0]}
          </h1>
        </div>
        {!user.is_verified && (
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            待實名
          </Link>
        )}
        {user.is_verified && (
          <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            已實名
          </div>
        )}
      </div>

      <DashboardClient balance={user.balance} />

      <div className="grid grid-cols-4 gap-3">
        {[
          { href: "/transfer", icon: ArrowUpRight, label: "轉帳", color: "bg-green-50 text-green-600" },
          { href: "/transfer?mode=receive", icon: ArrowDownLeft, label: "收款", color: "bg-emerald-50 text-emerald-500" },
          { href: "/history", icon: QrCode, label: "掃碼", color: "bg-blue-50 text-blue-500" },
          { href: "/profile", icon: Plus, label: "儲值", color: "bg-violet-50 text-violet-500" },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white border border-slate-100 hover:border-green-100 active:scale-95 transition-all duration-150"
          >
            <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">最近交易</h2>
          <Link href="/history" className="text-xs text-green-600 font-medium">
            查看全部
          </Link>
        </div>
        <p className="text-sm text-slate-400 text-center py-6">
          尚無交易紀錄，開始您的第一筆轉帳吧！
        </p>
      </div>
    </div>
  );
}

import { getSession } from "@/lib/auth";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Plus,
  ShieldCheck,
  AlertCircle,
  Lock,
  Building2,
  CreditCard,
} from "lucide-react";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">您好，</p>
          <h1 className="text-xl font-bold text-slate-900">
            {user.name || user.email.split("@")[0]}
          </h1>
        </div>
        {user.is_verified ? (
          <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            已實名驗證
          </div>
        ) : (
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            待實名
          </Link>
        )}
      </div>

      <DashboardClient balance={user.balance} />

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
          <Building2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-400">帳戶類型</p>
          <p className="text-xs font-semibold text-slate-800">一般儲值帳戶</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
          <Lock className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-400">安全保障</p>
          <p className="text-xs font-semibold text-slate-800">銀行級加密</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
          <CreditCard className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-400">幣別</p>
          <p className="text-xs font-semibold text-slate-800">巴拉幣 BLA</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2.5">快捷服務</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { href: "/transfer", icon: ArrowUpRight, label: "轉帳", color: "bg-green-50 text-green-600" },
            { href: "/transfer?mode=receive", icon: ArrowDownLeft, label: "收款", color: "bg-emerald-50 text-emerald-600" },
            { href: "/history", icon: QrCode, label: "掃碼", color: "bg-sky-50 text-sky-600" },
            { href: "/profile", icon: Plus, label: "儲值", color: "bg-violet-50 text-violet-600" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-sm active:scale-95 transition-all duration-150"
            >
              <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
        <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          您的帳戶受 256-bit SSL 加密與 e政府電子聲明保障。請勿向他人透露密碼或驗證碼。如有異常交易請立即聯繫客服。
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">最近交易</h2>
          <Link href="/history" className="text-xs text-green-600 font-medium">
            查看全部
          </Link>
        </div>
        <p className="text-sm text-slate-400 text-center py-8">
          尚無交易紀錄，開始您的第一筆轉帳吧！
        </p>
      </div>
    </div>
  );
}

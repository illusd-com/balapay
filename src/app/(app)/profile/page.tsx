"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  LogOut,
  Mail,
  CheckCircle2,
  Lock,
  FileCheck,
  User,
  Loader2,
} from "lucide-react";

type Me = {
  id: string;
  email: string;
  name: string | null;
  balance: number;
  is_verified: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (!r.ok) throw new Error("未登入");
        return r.json();
      })
      .then((data) => setUser(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-900">我的帳戶</h1>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-green-200">
          {(user?.name || user?.email || "U")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {user?.name || "使用者"}
          </p>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            {user?.email}
          </p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            餘額 {user?.balance?.toLocaleString() ?? 0} BLA
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-slate-900">實名驗證狀態</h2>
        </div>

        {user?.is_verified ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              已完成實名驗證
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  本帳戶已透過「e政府電子聲明」完成身分確認。系統僅在註冊當下進行單次驗證，
                  <strong className="text-slate-800">並未永久保存您的身分證字號</strong>。
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  資料存於 Turso 加密資料庫，傳輸採 256-bit TLS，密碼以 bcrypt 雜湊。
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <p className="text-sm text-slate-500">
            尚未完成實名驗證。請重新註冊並填寫真實姓名與身分證字號。
          </p>
        )}
      </div>

      <Link
        href="/mer"
        className="block bg-white rounded-2xl border border-slate-100 p-5 hover:border-green-200 hover:shadow-sm transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">商家中心</h2>
            <p className="text-xs text-slate-500 mt-0.5">收款碼 · API · 對帳</p>
          </div>
          <span className="text-green-600 text-sm">開啟 →</span>
        </div>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <h2 className="font-semibold text-slate-900 text-sm">安全保障</h2>
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Turso 正式資料庫 · 傳輸層 TLS
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            密碼 bcrypt 雜湊 · JWT HttpOnly Cookie
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            轉帳原子批次寫入 · 交易可追蹤
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            身分證字號僅單次確認、不落庫
          </li>
        </ul>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
      >
        <LogOut className="w-4 h-4" />
        安全登出
      </button>
    </div>
  );
}

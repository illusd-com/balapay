"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, LogOut, Mail, CheckCircle2, Lock, FileCheck, User, Loader2, IdCard,
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
  const [realName, setRealName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [govPassword, setGovPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function load() {
    fetch("/api/me")
      .then((r) => {
        if (!r.ok) throw new Error("未登入");
        return r.json();
      })
      .then((data) => setUser(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: realName, idNumber, password: govPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "驗證失敗");
      setMsg(data.message || "實名驗證成功");
      setIdNumber("");
      setGovPassword("");
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5 pb-8">
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
          <h2 className="font-semibold text-slate-900">實名驗證</h2>
        </div>

        {user?.is_verified ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              已完成實名驗證，可進行收付款
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  已透過「e政府電子聲明」完成身分確認。
                  <strong className="text-slate-800">系統不永久保存身分證字號</strong>。
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">資料存於 Turso，傳輸採 TLS，密碼 bcrypt 雜湊。</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              尚未實名。完成驗證前<strong>無法轉帳、掃碼付款或商家收款</strong>。
            </p>
            <div>
              <label className="text-[11px] text-slate-400">真實姓名（須與 e政府一致）</label>
              <input value={realName} onChange={(e) => setRealName(e.target.value)} className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" placeholder="真實姓名" required />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">巴拉國身分證字號（僅單次驗證，不存檔）</label>
              <div className="relative mt-1">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" placeholder="身分證字號" required />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400">e政府驗證密碼</label>
              <input type="password" value={govPassword} onChange={(e) => setGovPassword(e.target.value)} className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50" placeholder="e政府密碼" required />
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{err}</p>}
            {msg && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">{msg}</p>}
            <button type="submit" disabled={verifying} className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              {verifying ? "驗證中…" : "送出實名驗證"}
            </button>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              BalaPAY 已透過「e政府電子聲明」完成保障協議；我們<strong>不保存</strong>您的身分證字號。
            </p>
          </form>
        )}
      </div>

      <Link href="/mer" className="block bg-white rounded-2xl border border-slate-100 p-5 hover:border-green-200 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">商家中心</h2>
            <p className="text-xs text-slate-500 mt-0.5">收款碼 · API · 對帳</p>
          </div>
          <span className="text-green-600 text-sm">開啟 →</span>
        </div>
      </Link>

      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">
        <LogOut className="w-4 h-4" />
        安全登出
      </button>
    </div>
  );
}

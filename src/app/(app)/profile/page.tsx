"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  LogOut,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [idNumber, setIdNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string | null; email: string; is_verified: boolean } | null>(null);

  useEffect(() => {
    setUser({ name: "Demo User", email: "demo@balapay.com", is_verified: false });
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!idNumber || idNumber.length < 8) {
      setError("請輸入有效的巴拉國身分證字號");
      return;
    }
    setVerifying(true);
    // BlagovAPI not online yet — skip real check, simulate success
    await new Promise((r) => setTimeout(r, 1500));
    setVerifying(false);
    setVerified(true);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-4 pt-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-900">我的帳戶</h1>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
          {(user?.name || user?.email || "U")[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{user?.name || "使用者"}</p>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {user?.email}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-rose-500" />
          <h2 className="font-semibold text-slate-900">實名驗證</h2>
        </div>

        {verified || user?.is_verified ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            已完成實名驗證
          </motion.div>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              請輸入您的巴拉國身分證字號進行驗證。目前 BlagovAPI 尚未上線，將以模擬驗證通過。
            </p>
            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm px-4 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-3">
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                placeholder="巴拉國身分證字號"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm font-mono tracking-wider"
              />
              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl hover:bg-rose-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {verifying ? "驗證中..." : "提交驗證"}
              </button>
            </form>
          </>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
      >
        <LogOut className="w-4 h-4" />
        登出
      </button>
    </div>
  );
}

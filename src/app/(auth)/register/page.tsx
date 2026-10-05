"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  IdCard,
  FileCheck,
} from "lucide-react";

const SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6Lc9l-AtAAAAAOdRYtT24AG6fUQ5mLREBIvaYo3M";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => number;
      reset: (id?: number) => void;
      getResponse: (id?: number) => string;
    };
    onRecaptchaLoad?: () => void;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  const renderCaptcha = useCallback(() => {
    if (!captchaRef.current || !window.grecaptcha || widgetId.current !== null) return;
    widgetId.current = window.grecaptcha.render(captchaRef.current, {
      sitekey: SITE_KEY,
      callback: (token: string) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(""),
    });
  }, []);

  useEffect(() => {
    if (window.grecaptcha) {
      renderCaptcha();
      return;
    }
    window.onRecaptchaLoad = () => renderCaptcha();
    const existing = document.querySelector('script[src*="recaptcha/api.js"]');
    if (!existing) {
      const s = document.createElement("script");
      s.src =
        "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
  }, [renderCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 2) {
      setError("請輸入真實姓名（至少 2 個字）");
      return;
    }
    if (!idNumber.trim() || idNumber.trim().length < 8) {
      setError("請輸入有效的巴拉國身分證字號");
      return;
    }
    if (password.length < 8) {
      setError("密碼至少需要 8 個字元（同時用於 e政府驗證）");
      return;
    }
    if (!agreed) {
      setError("請勾選並同意驗證保護聲明");
      return;
    }
    if (!captchaToken) {
      setError("請完成下方機器人驗證");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email,
          password,
          idNumber: idNumber.trim().toUpperCase(),
          recaptchaToken: captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "註冊失敗");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "註冊失敗，請稍後再試");
      setCaptchaToken("");
      if (window.grecaptcha && widgetId.current !== null) {
        window.grecaptcha.reset(widgetId.current);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-200">
              B
            </div>
            <span className="font-bold text-xl text-slate-900">拔辣支付</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">開通安全帳戶</h1>
          <p className="mt-1 text-slate-500 text-sm">e政府實名驗證 · 銀行級加密</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 bg-white border border-slate-100 rounded-full px-2.5 py-1">
            <ShieldCheck className="w-3 h-3 text-green-600" /> 256-bit SSL
          </span>
          <span className="flex items-center gap-1 bg-white border border-slate-100 rounded-full px-2.5 py-1">
            <FileCheck className="w-3 h-3 text-green-600" /> e政府電子聲明
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl shadow-green-100/40 border border-slate-100 p-6 md:p-8 space-y-4"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              真實姓名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="須與 e政府登記姓名完全一致"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              巴拉國身分證字號 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                placeholder="向 e政府 API 查驗，不永久保存"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm font-mono tracking-wider text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              電子郵件 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              密碼 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 字元，同時用於 e政府驗證"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm text-slate-900 bg-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              此密碼會送至 e政府 API 驗證身分證登記，並作為 BalaPAY 登入密碼
            </p>
          </div>

          <div className="flex justify-center py-1">
            <div ref={captchaRef} />
          </div>

          <div className="rounded-2xl bg-green-50/80 border border-green-100 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">驗證保護聲明</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  BalaPAY 已透過「e政府電子聲明」完成保障協議。註冊時以身分證字號與密碼向
                  blagov API 單次查驗，
                  <strong className="text-slate-800">不會永久保存您的身分證字號</strong>
                  。姓名須與登記資料一致始可實名成功。
                </p>
              </div>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                我已閱讀並同意上述聲明，確認真實姓名、身分證字號與密碼正確。
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-green-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {loading ? "e政府驗證中..." : "實名驗證並開通"}
          </button>

          <p className="text-center text-sm text-slate-500">
            已有帳戶？{" "}
            <Link href="/login" className="text-green-600 font-medium hover:underline">
              立即登入
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

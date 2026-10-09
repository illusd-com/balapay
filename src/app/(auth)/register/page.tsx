"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

const SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6Lc9l-AtAAAAAOdRYtT24AG6fUQ5mLREBIvaYo3M";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (id?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  const renderCaptcha = useCallback(() => {
    if (!captchaRef.current || !window.grecaptcha) return;
    if (widgetId.current !== null) return;
    try {
      captchaRef.current.innerHTML = "";
      widgetId.current = window.grecaptcha.render(captchaRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    } catch (e) {
      console.error("[recaptcha]", e);
    }
  }, []);

  useEffect(() => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(renderCaptcha);
    } else {
      window.onRecaptchaLoad = () => window.grecaptcha?.ready(renderCaptcha);
      const s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      s.async = true;
      document.body.appendChild(s);
    }
  }, [renderCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("密碼至少 8 個字元");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          recaptchaToken: captchaToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "註冊失敗");
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "註冊失敗");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl">B</div>
            <span className="font-bold text-xl">拔辣支付</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">建立帳戶</h1>
          <p className="mt-1 text-slate-500 text-sm">註冊後請至「我的」完成實名驗證，才能收付款</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className={inputCls} placeholder="顯示名稱" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" className={inputCls} placeholder="電子郵件" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type={showPw ? "text" : "password"} className={inputCls + " pr-12"} placeholder="密碼（至少 8 字元）" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div ref={captchaRef} className="flex justify-center min-h-[78px]" />

          <motion.button whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-3.5 rounded-xl bg-green-600 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "註冊中…" : "註冊"}
          </motion.button>

          <p className="text-center text-sm text-slate-500">
            已有帳戶？{" "}
            <Link href="/login" className="text-green-600 font-medium hover:underline">登入</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

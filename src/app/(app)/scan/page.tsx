"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Store,
  X,
  Keyboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseQrPay, type QrPayPayload } from "@/lib/qrpay";

const easeOut = [0.23, 1, 0.32, 1] as const;
type Phase = "scan" | "confirm" | "success";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("scan");
  const [payload, setPayload] = useState<QrPayPayload | null>(null);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [camError, setCamError] = useState("");
  const [success, setSuccess] = useState<{
    amount: number;
    merchant: string;
    item: string;
    fromBalance: number;
    received: boolean;
  } | null>(null);
  const scanning = useRef(false);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const applyQr = useCallback(
    (text: string) => {
      const parsed = parseQrPay(text);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setError("");
      setPayload(parsed.data);
      setPhase("confirm");
      stopCam();
    },
    [stopCam]
  );

  useEffect(() => {
    if (phase !== "scan" || showManual) return;
    let cancelled = false;
    let raf = 0;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        // @ts-expect-error BarcodeDetector
        const BD = window.BarcodeDetector;
        if (!BD) {
          setCamError("此裝置不支援即時掃碼，請改用「貼上 QR 內容」");
          return;
        }
        const detector = new BD({ formats: ["qr_code"] });
        const tick = async () => {
          if (cancelled || scanning.current || !videoRef.current) return;
          try {
            scanning.current = true;
            const codes = await detector.detect(videoRef.current);
            if (codes?.length > 0 && codes[0].rawValue) {
              applyQr(codes[0].rawValue);
              return;
            }
          } catch {
            /* ignore */
          } finally {
            scanning.current = false;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setCamError("無法開啟相機，請允許權限或改用手動輸入");
      }
    }
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopCam();
    };
  }, [phase, showManual, applyQr, stopCam]);

  async function confirmPay() {
    if (!payload) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: payload.raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "付款失敗");
      setSuccess({
        amount: data.amount,
        merchant: data.merchant || payload.mername,
        item: data.item || payload.itemwhat,
        fromBalance: data.fromBalance,
        received: data.received,
      });
      setPhase("success");
    } catch (e: any) {
      setError(e.message || "付款失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">掃碼付款</h1>
        <p className="text-xs text-slate-400 mt-0.5">掃描商家 QR · 即時結帳入帳</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "scan" && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {!showManual ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[3/4] max-h-[420px]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs opacity-90">
                  將商家 QR 對準框內
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                <label className="text-sm font-medium text-slate-700">貼上 QR 文字內容</label>
                <textarea
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  rows={5}
                  placeholder="paywho=shop@example.com&payhow=120&itemhowmany=2&itemhowmuch1=60&itemwhat=咖啡&mername=拔辣咖啡"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 font-mono outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
                <button
                  type="button"
                  onClick={() => applyQr(manual)}
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  解析並結帳
                </button>
              </div>
            )}

            {camError && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">{camError}</p>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <button
              type="button"
              onClick={() => {
                setShowManual((v) => !v);
                setError("");
                if (!showManual) stopCam();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl"
            >
              {showManual ? (
                <>
                  <Camera className="w-4 h-4" /> 改用相機掃碼
                </>
              ) : (
                <>
                  <Keyboard className="w-4 h-4" /> 貼上 QR 內容
                </>
              )}
            </button>
          </motion.div>
        )}

        {phase === "confirm" && payload && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">商家</p>
                  <p className="font-semibold text-slate-900">{payload.mername}</p>
                  <p className="text-xs text-slate-500">{payload.paywho}</p>
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{payload.itemwhat}</p>
                  <p className="text-xs text-slate-500">
                    單價 {payload.itemhowmuch1} × {payload.itemhowmany} 件
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-slate-600">應付金額</span>
                <span className="text-xl font-bold text-green-700 tabular-nums">
                  {payload.payhow} BLA
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhase("scan");
                  setPayload(null);
                  setError("");
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> 取消
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={confirmPay}
                className="flex-[1.4] py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-green-200"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "付款中..." : "確認付款"}
              </button>
            </div>
          </motion.div>
        )}

        {phase === "success" && success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="flex flex-col items-center py-10"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">結帳成功</h2>
            <p className="text-slate-500 text-sm mt-1">
              已付款 {success.amount} BLA 給 {success.merchant}
            </p>
            <div className="mt-6 w-full max-w-sm bg-white rounded-2xl border border-slate-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">商品</span>
                <span className="font-medium text-slate-800">{success.item}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">商家入帳</span>
                <span className="text-emerald-600 font-medium">
                  {success.received ? "已入帳 ✓" : "待商家開戶"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">您的新餘額</span>
                <span className="font-semibold">{success.fromBalance} BLA</span>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setPhase("scan");
                  setPayload(null);
                  setSuccess(null);
                }}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium"
              >
                再掃一筆
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold"
              >
                返回首頁
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

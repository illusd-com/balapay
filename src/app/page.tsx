"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Wallet,
  ShieldCheck,
  Zap,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

const features = [
  { icon: Wallet, title: "即時餘額", desc: "隨時掌握您的巴拉幣餘額，一目了然。" },
  { icon: Zap, title: "秒速轉帳", desc: "輸入 Email 即可即時轉帳給好友或商家。" },
  { icon: ShieldCheck, title: "實名安全", desc: "巴拉國身分證驗證，保障交易真實可靠。" },
  { icon: MessageCircle, title: "AI 客服", desc: "24 小時 NVIDIA 智慧客服，隨時解答疑問。" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] },
  }),
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-slate-50">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-green-100/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-200 group-active:scale-95 transition-transform duration-150">
              B
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              拔辣支付 <span className="text-green-700 font-medium">BalaPAY</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-green-700 transition-colors px-3 py-2">
              登入
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 active:scale-95 transition-all duration-150 shadow-md shadow-green-200">
              立即註冊
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              隸屬 blagov.illusd.com
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              拔辣支付<br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">讓支付更有溫度</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-5 text-lg text-slate-600 leading-relaxed max-w-md">
              巴拉國官方數位錢包。安全轉帳、即時餘額、AI 智慧客服，一次滿足所有支付需求。
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-green-700 active:scale-[0.97] transition-all duration-150 shadow-lg shadow-green-200">
                免費開通帳戶 <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 bg-white text-slate-700 font-medium px-6 py-3 rounded-full border border-slate-200 hover:border-green-200 hover:text-green-700 active:scale-[0.97] transition-all duration-150">
                已有帳號？登入
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.2 }} className="relative mx-auto">
            <div className="w-[280px] md:w-[320px] rounded-[2.5rem] bg-slate-900 p-3 shadow-2xl shadow-green-200/50">
              <div className="rounded-[2rem] bg-gradient-to-b from-green-500 to-emerald-500 overflow-hidden">
                <div className="bg-white/10 backdrop-blur px-5 pt-8 pb-6 text-white">
                  <p className="text-sm opacity-80">目前餘額</p>
                  <p className="text-3xl font-bold mt-1 tracking-tight">BLA 12,850</p>
                  <div className="flex gap-2 mt-5">
                    <div className="flex-1 bg-white/20 rounded-xl py-2.5 text-center text-sm font-medium">轉帳</div>
                    <div className="flex-1 bg-white/20 rounded-xl py-2.5 text-center text-sm font-medium">收款</div>
                    <div className="flex-1 bg-white/20 rounded-xl py-2.5 text-center text-sm font-medium">更多</div>
                  </div>
                </div>
                <div className="bg-white px-5 py-4 space-y-3">
                  {[{"name": "咖啡店", "amount": "-85", "time": "今天 14:22"}, {"name": "小明轉入", "amount": "+500", "time": "昨天 09:15"}, {"name": "超市購物", "amount": "-320", "time": "10/02"}].map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.time}</p>
                      </div>
                      <p className={`font-semibold ${t.amount.startsWith("+") ? "text-emerald-500" : "text-slate-800"}`}>{t.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.4 }} className="absolute -left-4 top-24 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-medium text-slate-700">已實名驗證</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75, duration: 0.4 }} className="absolute -right-2 bottom-32 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-medium text-slate-700">秒到帳</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">為什麼選擇拔辣支付？</h2>
          <p className="mt-2 text-slate-500">專為巴拉國打造的智慧支付體驗</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-green-100 transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-500 p-8 md:p-12 text-center text-white shadow-xl shadow-green-200">
          <h2 className="text-2xl md:text-3xl font-bold">立即開通您的拔辣帳戶</h2>
          <p className="mt-3 text-green-100 max-w-md mx-auto">使用電子郵件快速註冊，完成實名驗證後即可開始轉帳與收款。</p>
          <Link href="/register" className="inline-flex items-center gap-2 mt-6 bg-white text-green-700 font-semibold px-8 py-3 rounded-full hover:bg-green-50 active:scale-[0.97] transition-all duration-150">
            免費註冊 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-green-600 text-white text-xs font-bold flex items-center justify-center">B</div>
            <span>拔辣支付 BalaPAY © 2026</span>
          </div>
          <p>隸屬 blagov.illusd.com · 巴拉國數位支付平台</p>
        </div>
      </footer>
    </div>
  );
}

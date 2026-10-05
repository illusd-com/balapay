"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HelpPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "您好！我是拔辣支付 AI 客服。有什麼可以幫您的嗎？例如：如何轉帳、實名驗證、餘額查詢等。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "無法取得回覆");
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `抱歉，發生錯誤：${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-slate-900">AI 客服</h1>
        <p className="text-xs text-slate-400">由 NVIDIA NIM 驅動</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.role === "user" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-green-600 text-white rounded-br-md"
                    : "bg-white border border-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-600" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-100 bg-white/80 backdrop-blur">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入您的問題..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm text-slate-900 bg-white placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all duration-150 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

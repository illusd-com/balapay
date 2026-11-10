"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Nfc, Loader2, Shield, Ban, Plus, RefreshCw, Bell, Lock,
} from "lucide-react";

type CardRow = {
  card_id: string;
  belong_email: string;
  status: string;
  label: string | null;
  issued_at: string;
};

type LookupResult = {
  found: boolean;
  card_id?: string;
  status?: string;
  label?: string;
  owner_match?: boolean;
  belong_email?: string | null;
  balance?: number | null;
  wallet_name?: string | null;
  transactions?: {
    id: string; type: string; amount: number; counterpart: string; note: string; created_at: string;
  }[];
  message?: string;
  error?: string;
};

function hasNfc(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export default function ManageCardPage() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [manualId, setManualId] = useState("");
  const [lastPayload, setLastPayload] = useState("");
  const [label, setLabel] = useState("我的電子卡");
  const [nfcOk, setNfcOk] = useState(false);
  const [pushStatus, setPushStatus] = useState("");

  const loadMine = useCallback(async () => {
    try {
      const res = await fetch("/api/cards/mine", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setCards(data.cards || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setNfcOk(hasNfc());
    loadMine();
  }, [loadMine]);

  async function issueCard() {
    setErr(""); setMsg(""); setBusy(true);
    try {
      const res = await fetch("/api/cards/issue", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "發行失敗");
      setLastPayload(data.nfc_payload);
      setMsg(`已發行 ${data.card_id}。請寫入 NFC 或複製密文。`);
      await loadMine();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function writeNfc(payload: string) {
    setErr(""); setMsg("");
    if (!hasNfc()) {
      setErr("此裝置不支援 Web NFC（請用 Android Chrome + HTTPS）");
      return;
    }
    try {
      setBusy(true);
      // @ts-expect-error NDEFReader
      const reader = new NDEFReader();
      await reader.write({ records: [{ recordType: "text", data: payload }] });
      setMsg("已成功將加密資料寫入 NFC 卡");
    } catch (e: any) {
      setErr(e?.message || "寫入失敗");
    } finally {
      setBusy(false);
    }
  }

  async function readNfc() {
    setErr(""); setMsg(""); setLookup(null);
    if (!hasNfc()) {
      setErr("此裝置不支援 Web NFC");
      return;
    }
    try {
      setBusy(true);
      // @ts-expect-error NDEFReader
      const reader = new NDEFReader();
      await reader.scan();
      setMsg("請將卡片靠近手機…");
      reader.onreading = async (event: any) => {
        try {
          let text = "";
          for (const record of event.message.records) {
            if (record.recordType === "text") {
              const decoder = new TextDecoder(record.encoding || "utf-8");
              text += decoder.decode(record.data);
            }
          }
          if (!text) {
            setErr("卡上沒有可讀文字");
            return;
          }
          setLastPayload(text);
          await doLookup({ payload: text });
        } catch (e: any) {
          setErr(e.message || "讀卡失敗");
        }
      };
    } catch (e: any) {
      setErr(e?.message || "無法啟動 NFC");
    } finally {
      setBusy(false);
    }
  }

  async function doLookup(body: { payload?: string; cardId?: string }) {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/cards/lookup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "查詢失敗");
      setLookup(data);
      setMsg(data.message || "查詢完成");
    } catch (e: any) {
      setErr(e.message);
      setLookup(null);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(cardId: string) {
    if (!confirm("確定掛失此卡？")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/cards/revoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "掛失失敗");
      setMsg("已掛失 " + cardId);
      await loadMine();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function enablePush() {
    setPushStatus("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushStatus("此瀏覽器不支援 Web Push");
        return;
      }
      const vapidRes = await fetch("/api/push/vapid");
      const vapid = await vapidRes.json();
      if (!vapid.configured) {
        setPushStatus("伺服器尚未設定 VAPID 金鑰");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("使用者未允許通知");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error((await res.json()).error || "訂閱失敗");
      setPushStatus("已開啟交易推播通知");
    } catch (e: any) {
      setPushStatus(e.message || "推播設定失敗");
    }
  }

  return (
    <div className="px-4 pt-6 pb-10 space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-600" />
          電子卡管理
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          巴拉國電子化：記名 NFC（AES 加密）。餘額與網站錢包同步。
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs text-emerald-900 flex gap-2">
        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          明文為 Belong=email 與 Card-ID，寫入前 AES-256-GCM 加密。僅 Belong 與登入帳號相同才顯示金額。
        </div>
      </div>

      {!nfcOk && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
          此裝置可能不支援 Web NFC。仍可發行與手動輸入 Card-ID；寫卡請用 Android Chrome。
        </div>
      )}

      {(err || msg) && (
        <div className={`rounded-xl text-sm px-4 py-3 ${err ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
          {err || msg}
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm">
        <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" /> 發行新卡
        </h2>
        <input value={label} onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="卡片名稱" />
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={issueCard}
            className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60">
            {busy ? "處理中…" : "雲端發行"}
          </button>
          {lastPayload && (
            <button disabled={busy} onClick={() => writeNfc(lastPayload)}
              className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-semibold">
              寫入 NFC 卡
            </button>
          )}
        </div>
        {lastPayload && (
          <p className="text-[10px] text-slate-400 break-all font-mono bg-slate-50 p-2 rounded-lg">{lastPayload}</p>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm">
        <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <Nfc className="w-4 h-4 text-emerald-600" /> 刷卡／查詢
        </h2>
        <button disabled={busy} onClick={readNfc}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Nfc className="w-4 h-4" />}
          刷 NFC 卡查詢
        </button>
        <div className="flex gap-2">
          <input value={manualId} onChange={(e) => setManualId(e.target.value)}
            placeholder="或輸入 Card-ID" className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono" />
          <button disabled={busy || !manualId.trim()} onClick={() => doLookup({ cardId: manualId.trim() })}
            className="px-4 rounded-xl border border-slate-200 text-sm font-medium">查詢</button>
        </div>

        {lookup && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
            <p className="text-xs text-slate-500">Card-ID</p>
            <p className="font-mono text-sm font-semibold text-slate-900">{lookup.card_id}</p>
            <p className="text-xs text-slate-500">狀態 · {lookup.status}</p>
            {lookup.owner_match ? (
              <>
                <p className="text-xs text-slate-500">記名 Belong</p>
                <p className="text-sm">{lookup.belong_email}</p>
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {lookup.balance?.toLocaleString() ?? "—"}{" "}
                  <span className="text-sm font-medium text-slate-500">BLA</span>
                </p>
                <p className="text-xs text-slate-400">與網站錢包同一餘額</p>
                {lookup.transactions && lookup.transactions.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-600">交易明細</p>
                    {lookup.transactions.slice(0, 10).map((t) => (
                      <div key={t.id} className="flex justify-between text-xs bg-white rounded-lg px-2 py-1.5 border border-slate-100">
                        <span className="text-slate-500 truncate max-w-[60%]">{t.note || t.type}</span>
                        <span className={Number(t.amount) >= 0 ? "text-emerald-600" : "text-slate-800"}>
                          {Number(t.amount) > 0 ? "+" : ""}{Number(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                此卡非本帳號所有，無法顯示金額與明細
              </div>
            )}
          </motion.div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">我的卡片</h2>
          <button onClick={loadMine} className="text-slate-400"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
        ) : cards.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">尚未發行卡片</p>
        ) : (
          <ul className="space-y-2">
            {cards.map((c) => (
              <li key={c.card_id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.label || "電子卡"}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{c.card_id}</p>
                  <p className="text-[10px] text-slate-400">{c.status === "active" ? "使用中" : "已掛失"}</p>
                </div>
                {c.status === "active" && (
                  <button onClick={() => revoke(c.card_id)}
                    className="shrink-0 text-xs text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50">
                    <Ban className="w-3.5 h-3.5" /> 掛失
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shadow-sm">
        <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" /> 交易即時通知
        </h2>
        <p className="text-xs text-slate-500">入帳／付款時 Web Push 通知。</p>
        <button onClick={enablePush} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">
          開啟推播
        </button>
        {pushStatus && <p className="text-xs text-slate-500">{pushStatus}</p>}
      </section>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

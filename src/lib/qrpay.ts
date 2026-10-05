/**
 * Merchant QR payload:
 *   paywho={商家Email}
 *   payhow={總金額}
 *   itemhowmany={商品數量}
 *   itemhowmuch1={單價}
 *   itemwhat={商品名}
 *   mername={商家名稱}
 */

export type QrPayPayload = {
  paywho: string;
  payhow: number;
  itemhowmany: number;
  itemhowmuch1: number;
  itemwhat: string;
  mername: string;
  raw: string;
};

export function parseQrPay(raw: string): { ok: true; data: QrPayPayload } | { ok: false; error: string } {
  if (!raw || !raw.trim()) {
    return { ok: false, error: "QR 內容為空" };
  }

  const text = raw.trim();
  const map: Record<string, string> = {};

  const normalized = text
    .replace(/^\//, "")
    .replace(/\/$/g, "")
    .replace(/\//g, "&");

  const pairs = normalized.split(/[&\n\r;]+/);
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim().toLowerCase();
    const val = pair.slice(idx + 1).trim();
    if (key) map[key] = val;
  }

  const paywho = (map.paywho || "").toLowerCase().trim();
  if (!paywho || !paywho.includes("@")) {
    return { ok: false, error: "QR 缺少有效商家 Email（paywho）" };
  }

  const payhow = parseFloat(map.payhow || "0");
  const itemhowmany = parseInt(map.itemhowmany || "1", 10) || 1;
  const itemhowmuch1 = parseFloat(map.itemhowmuch1 || String(payhow));
  const itemwhat = map.itemwhat || "商品";
  const mername = map.mername || paywho.split("@")[0];

  let amount = payhow;
  if (!(amount > 0) && itemhowmuch1 > 0) {
    amount = Math.round(itemhowmuch1 * itemhowmany * 100) / 100;
  }

  if (!(amount > 0)) {
    return { ok: false, error: "QR 金額無效（payhow 或 itemhowmuch1）" };
  }

  return {
    ok: true,
    data: {
      paywho,
      payhow: amount,
      itemhowmany,
      itemhowmuch1: itemhowmuch1 > 0 ? itemhowmuch1 : amount,
      itemwhat,
      mername,
      raw: text,
    },
  };
}

export function buildPaymentNote(data: QrPayPayload): string {
  return `掃碼付款｜${data.mername}｜${data.itemwhat} x${data.itemhowmany}`;
}

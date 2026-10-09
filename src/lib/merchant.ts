import { getTurso } from "./turso";
import crypto from "node:crypto";

export type Merchant = {
  mer_id: string;
  user_id: string;
  shop_name: string;
  api_key: string;
  email?: string;
  balance?: number;
};

const g = globalThis as unknown as {
  __merchants?: Map<string, Merchant>;
  __merByUser?: Map<string, string>;
  __merByKey?: Map<string, string>;
};

function mem() {
  if (!g.__merchants) {
    g.__merchants = new Map();
    g.__merByUser = new Map();
    g.__merByKey = new Map();
  }
  return {
    byId: g.__merchants!,
    byUser: g.__merByUser!,
    byKey: g.__merByKey!,
  };
}

function genMerId() {
  return "MER_" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

function genApiKey() {
  return "bp_live_" + crypto.randomBytes(24).toString("hex");
}

export async function activateMerchant(
  userId: string,
  shopName: string
): Promise<Merchant> {
  const name = shopName.trim() || "我的商店";
  const turso = getTurso();

  if (!turso) {
    const m = mem();
    const existing = m.byUser.get(userId);
    if (existing) {
      const mer = m.byId.get(existing)!;
      mer.shop_name = name;
      return mer;
    }
    const mer: Merchant = {
      mer_id: genMerId(),
      user_id: userId,
      shop_name: name,
      api_key: genApiKey(),
    };
    m.byId.set(mer.mer_id, mer);
    m.byUser.set(userId, mer.mer_id);
    m.byKey.set(mer.api_key, mer.mer_id);
    return mer;
  }

  const found = await turso.execute({
    sql: "SELECT mer_id, user_id, shop_name, api_key FROM merchants WHERE user_id = ?",
    args: [userId],
  });
  if (found.rows.length > 0) {
    const r = found.rows[0];
    await turso.execute({
      sql: "UPDATE merchants SET shop_name = ?, updated_at = datetime('now') WHERE mer_id = ?",
      args: [name, r.mer_id],
    });
    return {
      mer_id: r.mer_id as string,
      user_id: r.user_id as string,
      shop_name: name,
      api_key: r.api_key as string,
    };
  }

  const mer_id = genMerId();
  const api_key = genApiKey();
  await turso.execute({
    sql: `INSERT INTO merchants (mer_id, user_id, shop_name, api_key) VALUES (?, ?, ?, ?)`,
    args: [mer_id, userId, name, api_key],
  });
  return { mer_id, user_id: userId, shop_name: name, api_key };
}

export async function getMerchantByUser(userId: string): Promise<Merchant | null> {
  const turso = getTurso();
  if (!turso) {
    const id = mem().byUser.get(userId);
    return id ? mem().byId.get(id) || null : null;
  }
  const res = await turso.execute({
    sql: "SELECT mer_id, user_id, shop_name, api_key FROM merchants WHERE user_id = ?",
    args: [userId],
  });
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    mer_id: r.mer_id as string,
    user_id: r.user_id as string,
    shop_name: r.shop_name as string,
    api_key: r.api_key as string,
  };
}

export async function authMerchantApi(
  merId: string,
  apiKey: string
): Promise<Merchant | null> {
  if (!merId || !apiKey) return null;
  const turso = getTurso();

  if (!turso) {
    const mer = mem().byId.get(merId);
    if (!mer || mer.api_key !== apiKey) return null;
    return mer;
  }

  const res = await turso.execute({
    sql: "SELECT mer_id, user_id, shop_name, api_key FROM merchants WHERE mer_id = ? AND api_key = ?",
    args: [merId, apiKey],
  });
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    mer_id: r.mer_id as string,
    user_id: r.user_id as string,
    shop_name: r.shop_name as string,
    api_key: r.api_key as string,
  };
}

export function buildQrPayload(opts: {
  email: string;
  amount: number;
  item: string;
  qty: number;
  unitPrice: number;
  shopName: string;
}) {
  const enc = (v: string | number) => encodeURIComponent(String(v ?? "").trim());
  return [
    `paywho=${enc(opts.email)}`,
    `payhow=${enc(opts.amount)}`,
    `itemhowmany=${enc(opts.qty)}`,
    `itemhowmuch1=${enc(opts.unitPrice)}`,
    `itemwhat=${enc(opts.item)}`,
    `mername=${enc(opts.shopName)}`,
  ].join("&");
}

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

async function resolveUserId(
  userId: string,
  email?: string | null
): Promise<string> {
  const turso = getTurso();
  if (!turso) return userId;

  const byId = await turso.execute({
    sql: "SELECT id FROM users WHERE id = ?",
    args: [userId],
  });
  if (byId.rows.length > 0) return byId.rows[0].id as string;

  if (email) {
    const byEmail = await turso.execute({
      sql: "SELECT id FROM users WHERE email = ? OR lower(email) = ?",
      args: [email.toLowerCase(), email.toLowerCase()],
    });
    if (byEmail.rows.length > 0) return byEmail.rows[0].id as string;
  }

  throw new Error("找不到對應的使用者帳戶，請登出後重新登入再啟用商家");
}

export async function activateMerchant(
  userId: string,
  shopName: string,
  email?: string | null
): Promise<Merchant> {
  const name = shopName.trim() || "我的商店";
  const turso = getTurso();

  if (!turso) {
    if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
      throw new Error("資料庫未連線，無法啟用商家");
    }
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

  const resolvedId = await resolveUserId(userId, email);

  const found = await turso.execute({
    sql: "SELECT mer_id, user_id, shop_name, api_key FROM merchants WHERE user_id = ?",
    args: [resolvedId],
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
  try {
    await turso.execute({
      sql: `INSERT INTO merchants (mer_id, user_id, shop_name, api_key) VALUES (?, ?, ?, ?)`,
      args: [mer_id, resolvedId, name, api_key],
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.error("[activateMerchant]", msg);
    if (/UNIQUE|unique/i.test(msg)) {
      const again = await turso.execute({
        sql: "SELECT mer_id, user_id, shop_name, api_key FROM merchants WHERE user_id = ?",
        args: [resolvedId],
      });
      if (again.rows.length > 0) {
        const r = again.rows[0];
        return {
          mer_id: r.mer_id as string,
          user_id: r.user_id as string,
          shop_name: r.shop_name as string,
          api_key: r.api_key as string,
        };
      }
      throw new Error("商家資料衝突，請重新整理後再試");
    }
    if (/FOREIGN KEY|foreign key/i.test(msg)) {
      throw new Error("帳戶尚未正確寫入資料庫，請登出後重新註冊／登入");
    }
    throw new Error("啟用商家失敗：" + msg.slice(0, 120));
  }

  return { mer_id, user_id: resolvedId, shop_name: name, api_key };
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

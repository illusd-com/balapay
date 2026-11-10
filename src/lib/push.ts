import webpush from "web-push";
import { getTurso } from "./turso";
import { v4 as uuidv4 } from "uuid";

function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@balapay.illusd.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  const turso = getTurso();
  if (!turso) throw new Error("資料庫未連線");
  const id = uuidv4();
  try {
    await turso.execute({
      sql: `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(endpoint) DO UPDATE SET
              user_id = excluded.user_id,
              p256dh = excluded.p256dh,
              auth = excluded.auth`,
      args: [id, userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth],
    });
  } catch {
    await turso.execute({
      sql: `DELETE FROM push_subscriptions WHERE endpoint = ?`,
      args: [sub.endpoint],
    });
    await turso.execute({
      sql: `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)`,
      args: [id, userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth],
    });
  }
}

export async function notifyUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!configure()) {
    console.warn("[push] VAPID not configured, skip");
    return { sent: 0 };
  }
  const turso = getTurso();
  if (!turso) return { sent: 0 };

  const res = await turso.execute({
    sql: "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
    args: [userId],
  });

  let sent = 0;
  for (const row of res.rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint as string,
          keys: {
            p256dh: row.p256dh as string,
            auth: row.auth as string,
          },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          data: { url: payload.url || "/history" },
        })
      );
      sent++;
    } catch (e: any) {
      console.error("[push] send fail", e?.statusCode || e?.message);
      if (e?.statusCode === 410 || e?.statusCode === 404) {
        await turso.execute({
          sql: "DELETE FROM push_subscriptions WHERE id = ?",
          args: [row.id],
        });
      }
    }
  }
  return { sent };
}

import { createClient, type Client } from "@libsql/client";

let _client: Client | null | undefined;

export function getTurso(): Client | null {
  if (_client !== undefined) return _client;

  const url =
    process.env.TURSO_DATABASE_URL ||
    process.env.LIBSQL_URL ||
    process.env.DATABASE_URL ||
    "";
  const authToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN ||
    process.env.DATABASE_AUTH_TOKEN ||
    "";

  if (!url || !authToken) {
    console.warn(
      "[balapay] Turso credentials missing. Checked TURSO_DATABASE_URL / LIBSQL_URL / DATABASE_URL"
    );
    _client = null;
    return null;
  }

  try {
    _client = createClient({ url, authToken });
    console.log("[balapay] Turso client ready", url.replace(/\/\/.*@/, "//***@"));
  } catch (e) {
    console.error("[balapay] Turso createClient failed", e);
    _client = null;
  }
  return _client;
}

export function isTursoConfigured(): boolean {
  return Boolean(
    process.env.TURSO_DATABASE_URL ||
      process.env.LIBSQL_URL ||
      process.env.DATABASE_URL
  );
}

export async function ensureSchema() {
  const turso = getTurso();
  if (!turso) return;

  await turso.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        balance REAL DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        id_number TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        counterpart TEXT,
        note TEXT,
        status TEXT DEFAULT 'completed',
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS merchants (
        mer_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        shop_name TEXT NOT NULL,
        api_key TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_merchants_api ON merchants(api_key)`,
      `CREATE INDEX IF NOT EXISTS idx_merchants_user ON merchants(user_id)`,
    ],
    "write"
  );
}

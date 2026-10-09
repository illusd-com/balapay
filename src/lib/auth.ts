import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getTurso } from "./turso";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
  demoGetUserById,
  demoGetUserByEmail,
  demoCreateUser,
} from "./store";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "balapay-stable-dev-secret-do-set-env-32b"
);

const COOKIE_NAME = "balapay_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface User {
  id: string;
  email: string;
  name: string | null;
  balance: number;
  is_verified: boolean;
  id_number: string | null;
}

export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(
  userId: string,
  extra?: { email?: string; name?: string | null; is_verified?: boolean }
) {
  return new SignJWT({
    sub: userId,
    email: extra?.email || "",
    name: extra?.name || "",
    verified: extra?.is_verified ? 1 : 0,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.sub as string,
      email: (payload.email as string) || "",
      name: (payload.name as string) || "",
      is_verified: Number(payload.verified) === 1,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const claims = await verifyToken(token);
    if (!claims?.userId) return null;

    const turso = getTurso();
    if (!turso) {
      const local = demoGetUserById(claims.userId);
      if (local) {
        return {
          id: local.id,
          email: local.email,
          name: local.name,
          balance: local.balance,
          is_verified: local.is_verified,
          id_number: null,
        };
      }
      if (claims.email) {
        return {
          id: claims.userId,
          email: claims.email,
          name: claims.name || null,
          balance: 0,
          is_verified: Boolean(claims.is_verified),
          id_number: null,
        };
      }
      return null;
    }

    try {
      const result = await turso.execute({
        sql: "SELECT id, email, name, balance, is_verified, id_number FROM users WHERE id = ?",
        args: [claims.userId],
      });

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id as string,
          email: row.email as string,
          name: (row.name as string) || null,
          balance: Number(row.balance) || 0,
          is_verified: Number(row.is_verified) === 1,
          id_number: (row.id_number as string) || null,
        };
      }
    } catch (dbErr) {
      console.error("[getSession] turso", dbErr);
    }

    if (claims.email) {
      return {
        id: claims.userId,
        email: claims.email,
        name: claims.name || null,
        balance: 0,
        is_verified: Boolean(claims.is_verified),
        id_number: null,
      };
    }
    return null;
  } catch (e) {
    console.error("[getSession]", e);
    return null;
  }
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  isVerified = false
) {
  const turso = getTurso();
  const emailNorm = email.toLowerCase().trim();
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  if (!turso) {
    if (isProd) {
      throw new Error(
        "資料庫未連線，無法註冊。請在 Vercel 設定 TURSO_DATABASE_URL 與 TURSO_AUTH_TOKEN"
      );
    }
    const user = demoCreateUser({
      email: emailNorm,
      name,
      password,
      is_verified: isVerified,
    });
    return { id: user.id, email: user.email, name: user.name, is_verified: user.is_verified };
  }

  const id = uuidv4();
  const password_hash = await hashPassword(password);

  try {
    await turso.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, balance, is_verified) VALUES (?, ?, ?, ?, 38, ?)`,
      args: [id, emailNorm, password_hash, name, isVerified ? 1 : 0],
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/UNIQUE|unique/i.test(msg)) {
      throw new Error("此電子郵件已被註冊");
    }
    console.error("[registerUser] insert", e);
    throw new Error("註冊寫入資料庫失敗：" + msg.slice(0, 120));
  }

  const check = await turso.execute({
    sql: "SELECT id, email FROM users WHERE id = ? OR email = ?",
    args: [id, emailNorm],
  });
  if (check.rows.length === 0) {
    throw new Error("註冊未成功寫入資料庫，請重試或檢查 Turso 設定");
  }

  return {
    id: (check.rows[0].id as string) || id,
    email: emailNorm,
    name,
    is_verified: isVerified,
  };
}

export async function loginUser(email: string, password: string) {
  const emailNorm = String(email || "").trim().toLowerCase();
  const passwordNorm = String(password || "");
  if (!emailNorm || !passwordNorm) {
    throw new Error("請輸入電子郵件與密碼");
  }

  const turso = getTurso();

  if (!turso) {
    const local = demoGetUserByEmail(emailNorm);
    if (local && local.password === passwordNorm) {
      return {
        id: local.id,
        email: local.email,
        name: local.name,
        is_verified: local.is_verified,
      };
    }
    throw new Error("帳號或密碼錯誤（資料庫未連線，僅能驗證本機帳戶）");
  }

  let result;
  try {
    result = await turso.execute({
      sql: "SELECT id, email, name, password_hash, is_verified FROM users WHERE email = ? OR lower(email) = ?",
      args: [emailNorm, emailNorm],
    });
  } catch (e: any) {
    console.error("[loginUser] query", e);
    throw new Error("無法連線資料庫，請稍後再試");
  }

  if (result.rows.length === 0) {
    throw new Error("此電子郵件尚未註冊（若剛註冊過，可能當時未寫入資料庫，請重新註冊）");
  }

  const row = result.rows[0];
  const hash = row.password_hash as string;
  if (!hash) {
    throw new Error("此帳戶密碼資料異常，請重新註冊或聯絡支援");
  }

  let valid = false;
  try {
    valid = await verifyPassword(passwordNorm, hash);
  } catch (e) {
    console.error("[loginUser] bcrypt", e);
    throw new Error("密碼驗證失敗，請稍後再試");
  }

  if (!valid) {
    throw new Error("密碼錯誤");
  }

  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || null,
    is_verified: Number(row.is_verified) === 1,
  };
}

export function attachSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
  return res;
}

export function clearSessionOnResponse(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
}

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
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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
  extra?: { email?: string; name?: string | null }
) {
  return new SignJWT({
    sub: userId,
    email: extra?.email || "",
    name: extra?.name || "",
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
          is_verified: false,
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
          is_verified: Boolean(row.is_verified),
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
        is_verified: false,
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

  if (!turso) {
    const user = demoCreateUser({
      email,
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
      args: [id, email.toLowerCase(), password_hash, name, isVerified ? 1 : 0],
    });
    return { id, email, name, is_verified: isVerified };
  } catch (e: any) {
    if (e.message?.includes("UNIQUE")) {
      throw new Error("此電子郵件已被註冊");
    }
    throw e;
  }
}

export async function loginUser(email: string, password: string) {
  const turso = getTurso();

  if (!turso) {
    const local = demoGetUserByEmail(email);
    if (local && local.password === password) {
      return { id: local.id, email: local.email, name: local.name };
    }
    throw new Error("帳號或密碼錯誤");
  }

  const result = await turso.execute({
    sql: "SELECT id, email, name, password_hash FROM users WHERE email = ?",
    args: [email.toLowerCase()],
  });

  if (result.rows.length === 0) {
    throw new Error("帳號或密碼錯誤");
  }

  const row = result.rows[0];
  const valid = await verifyPassword(password, row.password_hash as string);
  if (!valid) {
    throw new Error("帳號或密碼錯誤");
  }

  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || null,
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

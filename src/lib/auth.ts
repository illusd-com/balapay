import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getTurso } from "./turso";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me-in-production-32chars"
);

export interface User {
  id: string;
  email: string;
  name: string | null;
  balance: number;
  is_verified: boolean;
  id_number: string | null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("balapay_session")?.value;
  if (!token) return null;

  const userId = await verifyToken(token);
  if (!userId) return null;

  const turso = getTurso();
  if (!turso) {
    return {
      id: userId,
      email: "demo@balapay.com",
      name: "Demo User",
      balance: 12850.5,
      is_verified: true,
      id_number: null,
    };
  }

  const result = await turso.execute({
    sql: "SELECT id, email, name, balance, is_verified, id_number FROM users WHERE id = ?",
    args: [userId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || null,
    balance: (row.balance as number) || 0,
    is_verified: Boolean(row.is_verified),
    id_number: (row.id_number as string) || null,
  };
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  isVerified = false
) {
  const turso = getTurso();
  const id = uuidv4();
  const password_hash = await hashPassword(password);

  if (!turso) {
    return { id, email, name, is_verified: isVerified };
  }

  try {
    // Note: id_number is intentionally NOT stored (one-time verification only)
    await turso.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, balance, is_verified) VALUES (?, ?, ?, ?, 1000, ?)`,
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
    if (email === "demo@balapay.com" && password === "demo1234") {
      return { id: "demo-user-id", email, name: "Demo User" };
    }
    throw new Error("帳號或密碼錯誤（Demo: demo@balapay.com / demo1234）");
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

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("balapay_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("balapay_session");
}

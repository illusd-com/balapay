/**
 * reCAPTCHA v2 server-side verify
 * Site key (client): NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 * Secret (server): RECAPTCHA_SECRET_KEY
 */

export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && process.env.RECAPTCHA_REQUIRED === "1") {
      console.error("[recaptcha] RECAPTCHA_SECRET_KEY missing");
      return false;
    }
    console.warn("[recaptcha] secret missing – skipping verify");
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (e) {
    console.error("[recaptcha]", e);
    return false;
  }
}

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6Lc9l-AtAAAAAOdRYtT24AG6fUQ5mLREBIvaYo3M";

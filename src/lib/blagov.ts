/**
 * Blagov e政府身分驗證
 * GET https://balala-government.vercel.app/id-check/id-pass={id}/password={password}
 */

export type BlagovResult =
  | { ok: true; name: string }
  | { ok: false; reason: string };

export async function checkBlagovId(
  idNumber: string,
  password: string
): Promise<BlagovResult> {
  const id = encodeURIComponent(idNumber.trim().toUpperCase());
  const pw = encodeURIComponent(password);
  const url = `https://balala-government.vercel.app/id-check/id-pass=${id}/password=${pw}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "text/plain, */*" },
      });
    } finally {
      clearTimeout(timer);
    }

    const text = (await res.text()).trim();
    console.log("[blagov] status", res.status, "body", text.slice(0, 200));

    if (!res.ok && !text) {
      return { ok: false, reason: `e政府回應異常（HTTP ${res.status}）` };
    }

    if (text.includes("*try-again*") || /id\s*=\s*false/i.test(text)) {
      return { ok: false, reason: "身分證字號或驗證密碼不正確，請重試" };
    }

    const match = text.match(/id\s*=\s*true[\s/]*name\s*=\s*([^\s*/&]+)/i);
    if (match?.[1] && match[1].toLowerCase() !== "unknow") {
      try {
        return { ok: true, name: decodeURIComponent(match[1]) };
      } catch {
        return { ok: true, name: match[1] };
      }
    }

    if (/id\s*=\s*true/i.test(text)) {
      const after = text.split(/name\s*=/i)[1] || "";
      const namePart = after.split(/[\s*/&]/)[0]?.trim();
      if (namePart && namePart.toLowerCase() !== "unknow") {
        try {
          return { ok: true, name: decodeURIComponent(namePart) };
        } catch {
          return { ok: true, name: namePart };
        }
      }
    }

    return { ok: false, reason: "無法解析 e政府回應，請稍後再試" };
  } catch (e: any) {
    console.error("[blagov]", e);
    if (e?.name === "AbortError") {
      return { ok: false, reason: "e政府連線逾時，請稍後再試" };
    }
    return { ok: false, reason: "e政府服務暫時無法連線，請稍後再試" };
  }
}

export function namesMatch(input: string, apiName: string): boolean {
  const norm = (s: string) =>
    s.replace(/\s+/g, "").replace(/　/g, "").trim().toLowerCase();
  const a = norm(input);
  const b = norm(apiName);
  return a.length > 0 && a === b;
}

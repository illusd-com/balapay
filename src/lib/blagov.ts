/**
 * Blagov e政府身分驗證
 * GET https://balala-government.vercel.app/id-check/id-pass={id}/password={password}
 *
 * 成功: /id=true/name={真實姓名}
 * 失敗: /id=false/name=unknow  或含 *try-again*
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
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const text = (await res.text()).trim();

    if (text.includes("*try-again*") || /id=false/i.test(text)) {
      return { ok: false, reason: "身分證字號或驗證密碼不正確，請重試" };
    }

    const match = text.match(/id=true\/name=([^\s*/]+)/i);
    if (match && match[1] && match[1].toLowerCase() !== "unknow") {
      return { ok: true, name: decodeURIComponent(match[1]) };
    }

    // Fallback parse: /id=true/name=張三
    if (/id=true/i.test(text)) {
      const after = text.split(/name=/i)[1] || "";
      const namePart = after.split(/[\s*/]/)[0]?.trim();
      if (namePart && namePart.toLowerCase() !== "unknow") {
        return { ok: true, name: namePart };
      }
    }

    return { ok: false, reason: "無法驗證身分，請稍後再試" };
  } catch (e: any) {
    console.error("[blagov]", e);
    return { ok: false, reason: "e政府服務暫時無法連線，請稍後再試" };
  }
}

/** 比對使用者填的姓名與 API 回傳姓名（允許空白差異） */
export function namesMatch(input: string, apiName: string): boolean {
  const a = input.replace(/\s+/g, "").trim();
  const b = apiName.replace(/\s+/g, "").trim();
  return a === b && a.length > 0;
}

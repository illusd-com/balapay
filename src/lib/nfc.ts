import crypto from "node:crypto";

export type NfcPlain = {
  belong: string;
  cardId: string;
};

const PREFIX = "BalaPAY.NFC.1.";

function getKey(): Buffer {
  const secret =
    process.env.NFC_CARD_SECRET ||
    process.env.JWT_SECRET ||
    "balapay-nfc-dev-secret-change-me-32b";
  return crypto.createHash("sha256").update(secret).digest();
}

export function buildPlainText(belong: string, cardId: string): string {
  return `Belong=${belong.trim().toLowerCase()}\nCard-ID=${cardId.trim()}`;
}

export function parsePlainText(text: string): NfcPlain | null {
  const belong = text.match(/Belong\s*=\s*([^\s\n\r]+)/i)?.[1]?.trim();
  const cardId = text.match(/Card-ID\s*=\s*([^\s\n\r]+)/i)?.[1]?.trim();
  if (!belong || !cardId || !belong.includes("@")) return null;
  return { belong: belong.toLowerCase(), cardId };
}

export function encryptNfcPayload(belong: string, cardId: string): string {
  const plain = buildPlainText(belong, cardId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const b64 = (b: Buffer) => b.toString("base64url");
  return `${PREFIX}${b64(iv)}.${b64(enc)}.${b64(tag)}`;
}

export function decryptOrParseNfcPayload(raw: string): NfcPlain | null {
  const text = String(raw || "").trim();
  if (!text) return null;

  if (text.startsWith(PREFIX)) {
    try {
      const body = text.slice(PREFIX.length);
      const [ivB, ctB, tagB] = body.split(".");
      if (!ivB || !ctB || !tagB) return null;
      const iv = Buffer.from(ivB, "base64url");
      const ct = Buffer.from(ctB, "base64url");
      const tag = Buffer.from(tagB, "base64url");
      const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
      return parsePlainText(plain);
    } catch {
      return null;
    }
  }

  return parsePlainText(text);
}

export function generateCardId(): string {
  return "BP-CARD-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

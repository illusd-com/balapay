import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json({
      configured: false,
      publicKey: null,
      message: "尚未設定 VAPID 金鑰（NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY）",
    });
  }
  return NextResponse.json({ configured: true, publicKey: key });
}

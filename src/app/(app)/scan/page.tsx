import { redirect } from "next/navigation";

/** QR 掃碼已下線，改為巴拉國電子化 NFC 記名卡 */
export default function ScanRedirectPage() {
  redirect("/manage-card");
}

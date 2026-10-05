import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "拔辣支付 BalaPAY | 巴拉國官方數位支付",
  description:
    "拔辣支付 BalaPAY — 安全、快速、智慧的數位錢包。隸屬 blagov.illusd.com",
  keywords: ["BalaPAY", "拔辣支付", "巴拉國", "數位支付", "電子錢包"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

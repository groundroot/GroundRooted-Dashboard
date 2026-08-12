import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GroundRooted HQ",
  description: "GroundRooted 운영 대시보드 — 앱 · 음악 · 판매 · PrayerWire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

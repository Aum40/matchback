import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "MATCHBACK — Swipe smart. Apply with confidence.", template: "%s | MATCHBACK" },
  description: "Find jobs that fit your skills, see why, and improve your application.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

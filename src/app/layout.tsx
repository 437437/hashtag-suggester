import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hashtag Suggester",
  description: "AIがX向けに最適なハッシュタグを提案するWebアプリ。280文字カウント対応。",
  openGraph: {
    title: "Hashtag Suggester",
    description: "AIがX向けに最適なハッシュタグを提案するWebアプリ。280文字カウント対応。",
    url: "https://hashtag-suggester.vercel.app/",
    siteName: "Hashtag Suggester",
  },
  twitter: {
    card: "summary",
    title: "Hashtag Suggester",
    description: "AIがX向けに最適なハッシュタグを提案するWebアプリ。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

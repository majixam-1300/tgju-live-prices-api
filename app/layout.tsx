import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TGJU Price Monitor",
  description: "Real-time financial prices from tgju.org — gold, currency, crypto and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-full antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}

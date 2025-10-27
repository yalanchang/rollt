import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rollt",
  description: "Rollt is a modern social media platform for sharing photos and videos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-white">{children}</body>
    </html>
  );
}
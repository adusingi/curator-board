import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curator Board",
  description: "Curated links worth keeping — AI, Africa, geopolitics, tech, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { buildThemeStyles, DEFAULT_THEME_ID } from "@/lib/themes";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Curator Board",
  description: "Curated links worth keeping — AI, Africa, geopolitics, tech, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME_ID}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: buildThemeStyles() }} />
      </head>
      <body className={`${displayFont.variable} ${monoFont.variable} min-h-full`}>{children}</body>
    </html>
  );
}

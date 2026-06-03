import type { Metadata } from "next";
import { Kalam, Caveat, Patrick_Hand, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const fontDisplay = Kalam({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const fontAccent = Caveat({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-accent",
});

const fontBody = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
});

const fontMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "BrewBoard",
  description: "Smart cafe ordering for dine-in tables."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontAccent.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Geist,
  Geist_Mono,
  Source_Serif_4,
  Noto_Serif_Bengali,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const readingSerif = Source_Serif_4({
  variable: "--font-reading",
  subsets: ["latin"],
  display: "swap",
});

// Bengali script covers Assamese (অসমীয়া); used for regional-language text.
const bengaliSerif = Noto_Serif_Bengali({
  variable: "--font-assamese",
  subsets: ["bengali"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "কিতাপ — a calm place to read",
    template: "%s · কিতাপ",
  },
  description:
    "কিতাপ is a calm, free digital reading room with strong book discovery and regional-language support (including Assamese).",
  openGraph: {
    type: "website",
    siteName: "কিতাপ",
    title: "কিতাপ — a calm place to read",
    description:
      "Discover and read free, legally distributable books. A calm digital reading room with regional-language support.",
  },
  twitter: {
    card: "summary",
    title: "কিতাপ — a calm place to read",
    description:
      "Discover and read free, legally distributable books. A calm digital reading room with regional-language support.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${readingSerif.variable} ${bengaliSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "sepia"]}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

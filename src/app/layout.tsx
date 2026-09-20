import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Geist,
  Geist_Mono,
  Source_Serif_4,
  Noto_Serif_Bengali,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

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
    process.env.APP_BASE_URL || "http://localhost:3000"
  ),
  title: {
    default: "Akshar — a calm place to read",
    template: "%s · Akshar",
  },
  description:
    "Akshar is a calm, free digital reading room with strong book discovery and regional-language support (including Assamese).",
  openGraph: {
    type: "website",
    siteName: "Akshar",
    title: "Akshar — a calm place to read",
    description:
      "Discover and read free, legally distributable books. A calm digital reading room with regional-language support.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Akshar — a calm place to read",
    description:
      "Discover and read free, legally distributable books. A calm digital reading room with regional-language support.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-180x180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Akshar",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

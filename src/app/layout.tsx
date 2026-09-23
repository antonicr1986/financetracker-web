import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import ThemeScript from "./theme-script";
import HtmlLang from "@/components/HtmlLang";
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

// Base absoluta para og:image y demas URLs de metadata. Sin esto Next emite
// rutas relativas y WhatsApp/Telegram no pueden descargar la imagen.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://financetracker-web-tau.vercel.app";

const title = "Finance tracker App";
const description = "Track your finances with ease";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Finance Tracker",
  // Los iconos y la tarjeta salen de los archivos de src/app:
  // icon.svg, favicon.ico, apple-icon.png, opengraph-image.jpg, twitter-image.jpg
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Finance Tracker",
    locale: "es_ES",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-200 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeScript />
        <HtmlLang />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

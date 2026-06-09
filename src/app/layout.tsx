import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ServiceWorkerRegistration from "@/components/sw-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#B42318",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Fraštačan – lokálne doručenie pre Hlohovec a okolie",
  description: "Objednaj si jedlo, kávu, kvety alebo nákup z lokálnych prevádzok v Hlohovci, Šulekove, Leopoldove a Červeníku. Platba kartou vopred alebo hotovosťou pri prevzatí.",
  keywords: [
    "Fraštačan",
    "Hlohovec doručenie",
    "rozvoz Hlohovec",
    "donáška Hlohovec",
    "Šulekovo doručenie",
    "Leopoldov doručenie",
    "Červeník doručenie",
    "lokálne prevádzky Hlohovec",
  ],
  authors: [{ name: "Fraštačan" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "Fraštačan – lokálne doručenie pre Hlohovec a okolie",
    description: "Jedlo, káva, kvety a nákup z lokálnych prevádzok.",
    siteName: "Fraštačan",
    locale: "sk_SK",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fraštačan",
  },
  icons: {
    icon: "/frastacan-logo.png",
    apple: "/frastacan-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/frastacan-logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" richColors closeButton />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Invensa · Inventario y ventas",
    template: "%s · Invensa",
  },
  description:
    "Sistema de inventario, ventas y reportes para tu tienda de barrio.",
  applicationName: "Invensa",
  authors: [{ name: "Invensa" }],
  generator: "Next.js",
  keywords: [
    "inventario",
    "ventas",
    "POS",
    "punto de venta",
    "tienda",
    "limpieza",
    "refacciones",
    "motocicletas",
    "México",
  ],
  // OpenGraph + Twitter in Spanish
  openGraph: {
    title: "Invensa · Inventario y ventas",
    description:
      "Sistema de inventario, ventas y reportes para tu tienda de barrio.",
    locale: "es_MX",
    type: "website",
    siteName: "Invensa",
  },
  twitter: {
    card: "summary",
    title: "Invensa · Inventario y ventas",
    description:
      "Sistema de inventario, ventas y reportes para tu tienda de barrio.",
  },
  formatDetection: { telephone: false, address: false, email: false },
  // Next.js App Router picks this up automatically as /icon.svg → favicon
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1f4ed8", // Taller cobalt (oklch 0.55 0.16 250 ≈ #2050d4)
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

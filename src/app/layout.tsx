import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockSense — Inventory Management",
  description: "Production-grade inventory management system built for Tanzania",
  applicationName: "StockSense",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "StockSense", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0A0F1E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const noFlashScript = `
    try {
      var t = localStorage.getItem('stocksense:theme') || 'dark';
      var a = localStorage.getItem('stocksense:accent') || '#6366F1';
      var resolved = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : t;
      var r = document.documentElement;
      r.dataset.theme = resolved;
      r.style.colorScheme = resolved;
      r.style.setProperty('--color-primary', a);
    } catch (e) {}
  `;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(17, 24, 39, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F9FAFB",
                backdropFilter: "blur(20px)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

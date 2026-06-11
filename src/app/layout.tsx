import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const noFlashScript = `
    try {
      var t = localStorage.getItem('stocksense:theme') || 'dark';
      var resolved = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : t;
      var r = document.documentElement;
      r.dataset.theme = resolved;
      var accents = {
        violet: ['#8B5CF6', '#ffffff'],
        amber: ['#F59E0B', '#231a05'],
        rose: ['#F43F5E', '#ffffff'],
        orange: ['#F97316', '#2b1503']
      };
      var a = accents[localStorage.getItem('stocksense:accent')];
      if (a) {
        ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring'].forEach(function (v) {
          r.style.setProperty(v, a[0]);
        });
        r.style.setProperty('--primary-foreground', a[1]);
        r.style.setProperty('--sidebar-primary-foreground', a[1]);
      }
    } catch (e) {}
  `;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

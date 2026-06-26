import "./globals.css";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/LocaleProvider";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { MicCapture } from "@/components/MicCapture";

export const metadata = {
  title: "Operations — Murtadha",
  description: "Personal operations dashboard",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ops" },
};

export const viewport = {
  themeColor: "#f5f6fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Default to en/ltr on the server; LocaleProvider corrects it on the client.
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
          <MicCapture />
          <BottomNav />
        </LocaleProvider>
      </body>
    </html>
  );
}

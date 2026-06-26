import "./globals.css";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/LocaleProvider";
import { BottomNav } from "@/components/BottomNav";
import { MicCapture } from "@/components/MicCapture";

export const metadata = {
  title: "Operations",
  description: "Personal operations dashboard",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ops" },
};

export const viewport = {
  themeColor: "#0b0f1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Default to en/ltr on the server; LocaleProvider corrects it on the client.
  return (
    <html lang="en" dir="ltr">
      <body>
        <LocaleProvider>
          <div className="app">{children}</div>
          <MicCapture />
          <BottomNav />
        </LocaleProvider>
      </body>
    </html>
  );
}

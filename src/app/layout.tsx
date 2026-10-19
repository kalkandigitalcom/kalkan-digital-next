import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/montserrat";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Kalkan Digital | Web Tasarım, Yazılım ve Dijital Büyüme", template: "%s | Kalkan Digital" },
  description:
    "Kalkan, Kaş merkezli Kalkan Digital; 2018'den beri işletmelere modern web siteleri, özel yazılım çözümleri ve dijital büyüme odaklı hizmetler sunar.",
  applicationName: "Kalkan Digital",
};

export const viewport: Viewport = {
  themeColor: "#0B1F3A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

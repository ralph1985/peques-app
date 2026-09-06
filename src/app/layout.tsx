import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PequesRoot } from "./peques-root";
import { PwaRuntime } from "@/shared/ui/pwa-runtime";

export const metadata: Metadata = {
  title: { default: "Peques", template: "%s | Peques" },
  description: "Peso, vacunas y sueño de tus peques. Solo en tu dispositivo.",
  applicationName: "Peques",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-180.png" },
  appleWebApp: { capable: true, title: "Peques", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#7c3aed" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PequesRoot>{children}</PequesRoot>
        <PwaRuntime />
      </body>
    </html>
  );
}

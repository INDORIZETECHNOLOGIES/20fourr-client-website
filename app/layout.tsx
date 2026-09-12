import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "20fourr",
    template: "%s · 20fourr",
  },
  description:
    "The security marketplace where every shift is documented: PSARA-licensed guards, OTP-gated duty, GST invoice per shift.",
  metadataBase: new URL("https://20fourr.com"),
};

export const viewport: Viewport = {
  themeColor: "#0A0E14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="ink"
      className={`h-full ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-full bg-page font-sans text-fg antialiased">{children}</body>
    </html>
  );
}

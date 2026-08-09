import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

/**
 * The dashboard design calls for Outfit (headings) and DM Sans (body). Loaded
 * through next/font so they are self-hosted and preloaded rather than fetched
 * from fonts.googleapis.com at runtime. Both are variable fonts, so no `weight`.
 *
 * The auth screens keep the system Helvetica stack — see --font-sans.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "20fourr",
    template: "%s · 20fourr",
  },
  description:
    "20fourr licensed security services platform. Manage bookings, guards and earnings in one place.",
};

export const viewport: Viewport = {
  themeColor: "#0a1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${outfit.variable} ${dmSans.variable}`}>
      <body className="min-h-full bg-bg text-text antialiased">{children}</body>
    </html>
  );
}

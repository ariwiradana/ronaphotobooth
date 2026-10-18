import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rona Management",
  description: "Booking and finance management for Rona Photobooth Bali",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rona",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}

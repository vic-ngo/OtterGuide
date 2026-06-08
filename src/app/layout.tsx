import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Figma's site uses the proprietary "Figma Sans" (a contemporary grotesque by
// Grilli Type). Hanken Grotesk is the closest free, web-available match.
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OtterGuide | Find vendors who accept your funding",
  description:
    "OtterGuide helps you search and filter Regional Center and Self-Determination Program vendors who already accept payment from Regional Center or a Financial Management System (FMS).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={hankenGrotesk.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

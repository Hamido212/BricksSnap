import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BricksForge - Free Template Generator for Bricks Builder",
  description:
    "Generate production-ready Bricks Builder templates for free. No subscriptions needed. Create hero sections, pricing tables, features grids, and full landing pages with copy-paste JSON.",
  keywords: [
    "Bricks Builder",
    "template generator",
    "WordPress",
    "page builder",
    "JSON templates",
    "free templates",
    "landing page",
    "web design",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

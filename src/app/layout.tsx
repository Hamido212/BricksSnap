import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BricksSnap - Free Template Generator for Bricks Builder",
  description:
    "Create editable Bricks Builder templates. Built-in templates are free; optional AI generation uses your own provider account. Create hero sections, pricing tables, features grids, and full landing pages with copy-paste JSON.",
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
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

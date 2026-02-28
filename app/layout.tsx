import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swedish Hockey Teams Map",
  description: "Interactive map of Swedish hockey teams and their hometowns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

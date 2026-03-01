import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Hockey Teams Map",
  description: "Interactive map of world hockey teams and their hometowns",
  openGraph: {
    title: "World Hockey Teams Map",
    description: "Interactive map of world hockey teams and their hometowns",
    type: "website",
  },
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

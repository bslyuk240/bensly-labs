import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bensly Labs",
  description: "Bensly Labs App Distribution Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    images: ["/opengraph-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

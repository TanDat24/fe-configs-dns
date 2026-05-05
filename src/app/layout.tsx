import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Config DNS",
  description: "Quản lý cấu hình DNS",
  openGraph: {
    title: "Config DNS",
    description: "Quản lý cấu hình DNS",
    type: "website",
    images: [
      {
        url: "/logo-1.png",
        width: 512,
        height: 240,
        alt: "Config DNS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Config DNS",
    description: "Quản lý cấu hình DNS",
    images: ["/logo-1.png"],
  },
  verification: {
    other: {
      "zalo-platform-site-verification":
        process.env.NEXT_PUBLIC_ZALO_SITE_VERIFICATION ??
        "GVsi8u3O0nrSzTX5XD5mIdFWtXMVbWj8E30m",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
